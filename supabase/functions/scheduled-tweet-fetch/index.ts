
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || 'cbd4102b6e7a4a5a95f9db1fd92c90e4';
// Twitter crypto list ID
const TWITTER_LIST_ID = '1674940005557387266';
const MAX_RETRIES = 3; // Maximum number of retries for API requests
const RETRY_DELAY = 1000; // Delay between retries in milliseconds

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the X-Client-Info headers
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zzbftruhrjfmynhamypk.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok && retries > 0) {
      console.log(`Request failed with status ${response.status}, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1)));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Request failed with error: ${error.message}, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1)));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// Function to get stored cursor from the database
async function getStoredCursor(supabase, mode) {
  try {
    const { data, error } = await supabase
      .from('twitter_cursors')
      .select('cursor_value')
      .eq('cursor_type', mode)
      .single();
    
    if (error) {
      console.error('Error fetching stored cursor:', error);
      return null;
    }
    
    return data?.cursor_value || null;
  } catch (error) {
    console.error('Exception when fetching cursor:', error);
    return null;
  }
}

// Function to store cursor in the database
async function storeCursor(supabase, mode, cursorValue) {
  if (!cursorValue) return;
  
  try {
    const { error } = await supabase
      .from('twitter_cursors')
      .upsert(
        { 
          cursor_type: mode, 
          cursor_value: cursorValue,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'cursor_type' }
      );
    
    if (error) {
      console.error('Error storing cursor:', error);
    } else {
      console.log(`Successfully stored cursor for mode: ${mode}`);
    }
  } catch (error) {
    console.error('Exception when storing cursor:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Scheduled tweet fetch function called');
    
    // Create Supabase client for database operations
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the 'newer' cursor for fetching latest tweets
    let cursor = await getStoredCursor(supabase, 'newer');
    let totalFetched = 0;
    let totalStored = 0;
    let lastCursor = null;
    
    console.log(`Starting scheduled fetch with cursor: ${cursor || 'initial'}`);
    
    // Construct URL with pagination parameters
    let url = `https://api.twitterapi.io/twitter/list/tweets?listId=${TWITTER_LIST_ID}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }
    
    let response;
    try {
      response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'X-API-Key': TWITTER_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Twitter API error:', errorText, 'Status:', response.status);
        throw new Error(`Twitter API error: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error(`Failed to fetch tweets: ${error.message}`);
      throw error;
    }

    // Parse response
    const data = await response.json();
    
    // Check if we have tweets in the response
    if (!data.tweets || !Array.isArray(data.tweets) || data.tweets.length === 0) {
      console.log('No new tweets found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No new tweets found',
        totalFetched: 0,
        totalStored: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Fetched ${data.tweets.length} tweets`);
    totalFetched = data.tweets.length;
    
    // Process tweets for storage
    const processedTweets = data.tweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      created_at: new Date(tweet.createdAt),
      author_username: tweet.author?.userName || tweet.user?.screen_name || "unknown",
      author_name: tweet.author?.name || tweet.user?.name,
      author_profile_picture: tweet.author?.profilePicture || tweet.user?.profile_image_url_https,
      is_reply: !!tweet.isReply || !!tweet.in_reply_to_status_id,
      is_quote: !!tweet.quoted_tweet || !!tweet.is_quote_status,
      in_reply_to_id: tweet.inReplyToId || tweet.in_reply_to_status_id,
      quoted_tweet_id: tweet.quoted_tweet?.id,
      quoted_tweet_text: tweet.quoted_tweet?.text,
      quoted_tweet_author: tweet.quoted_tweet?.author?.userName || 
                           (tweet.quoted_tweet?.user?.screen_name),
      entities: tweet.entities || {},
      extended_entities: tweet.extendedEntities || tweet.extended_entities || {},
    }));
    
    // Store tweets in the database
    if (processedTweets.length > 0) {
      const { error, count } = await supabase
        .from('historical_tweets')
        .upsert(processedTweets, { 
          onConflict: 'id',
          count: 'exact' // Get the count of affected rows
        });
      
      if (error) {
        console.error('Error storing tweets in database:', error);
      } else {
        console.log(`Successfully stored ${count} tweets in the database`);
        totalStored = count || 0;
      }
    }
    
    // Store the cursor for next time
    if (data.next_cursor) {
      lastCursor = data.next_cursor;
      await storeCursor(supabase, 'newer', lastCursor);
    }

    return new Response(JSON.stringify({
      success: true,
      totalFetched,
      totalStored,
      nextCursor: lastCursor,
      message: `Successfully fetched ${totalFetched} tweets (stored ${totalStored} new/updated tweets)`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scheduled tweet fetch function:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: "Error fetching latest tweets"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
