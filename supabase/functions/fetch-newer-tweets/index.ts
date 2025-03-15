
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || 'cbd4102b6e7a4a5a95f9db1fd92c90e4';
// Twitter crypto list ID
const TWITTER_LIST_ID = '1674940005557387266';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zzbftruhrjfmynhamypk.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok && retries > 0) {
      console.log(`Request failed with status ${response.status}, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Request failed with error: ${error.message}, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
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
    // Parse the request to get the cutoff date and max batches
    const { cutoffDate = '2025-03-09T13:25:14.763946+00:00', maxBatches = 5 } = await req.json();
    console.log(`Starting fetch-newer-tweets with cutoff date: ${cutoffDate}, max batches: ${maxBatches}`);
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Start with no cursor to get the latest tweets
    let nextCursor = null;
    let totalFetched = 0;
    let totalStored = 0;
    let pagesProcessed = 0;
    let reachedCutoff = false;
    const cutoffTimestamp = new Date(cutoffDate).getTime();
    
    // Process batches until we reach the cutoff date, max batches, or run out of tweets
    for (let i = 0; i < maxBatches && !reachedCutoff; i++) {
      // Construct URL with pagination parameters
      let url = `https://api.twitterapi.io/twitter/list/tweets?listId=${TWITTER_LIST_ID}`;
      if (nextCursor) {
        url += `&cursor=${nextCursor}`;
      }
      
      console.log(`Request ${i+1}/${maxBatches}, URL: ${url}`);
      
      // Fetch tweets from Twitter API
      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'X-API-Key': TWITTER_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twitter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      pagesProcessed++;
      
      if (!data.tweets || !Array.isArray(data.tweets) || data.tweets.length === 0) {
        console.log(`No tweets returned in request ${i+1}, ending pagination`);
        break;
      }
      
      console.log(`Fetched ${data.tweets.length} tweets in page ${i+1}`);
      totalFetched += data.tweets.length;
      
      // Check if we've reached the cutoff date in this batch
      const oldestTweetDate = new Date(data.tweets[data.tweets.length - 1].createdAt).getTime();
      console.log(`Oldest tweet in this batch: ${new Date(oldestTweetDate).toISOString()}`);
      console.log(`Cutoff date: ${new Date(cutoffTimestamp).toISOString()}`);
      
      if (oldestTweetDate <= cutoffTimestamp) {
        console.log(`Reached cutoff date with tweet from ${new Date(oldestTweetDate).toISOString()}`);
        reachedCutoff = true;
      }
      
      // Process tweets for storage
      const processedTweets = data.tweets.map(tweet => {
        const createdAt = new Date(tweet.createdAt);
        // Only include tweets newer than the cutoff date
        if (createdAt.getTime() > cutoffTimestamp) {
          return {
            id: tweet.id,
            text: tweet.text,
            created_at: createdAt,
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
          };
        }
        return null;
      }).filter(Boolean);
      
      // Store tweets in the database
      if (processedTweets.length > 0) {
        const { error, count } = await supabase
          .from('historical_tweets')
          .upsert(processedTweets, { 
            onConflict: 'id',
            count: 'exact'
          });
        
        if (error) {
          console.error('Error storing tweets in database:', error);
        } else {
          console.log(`Successfully stored ${count} tweets in the database`);
          totalStored += count || 0;
        }
      } else {
        console.log('No new tweets to store after filtering by cutoff date');
      }
      
      // Update cursor for next page if available
      if (data.next_cursor && !reachedCutoff) {
        nextCursor = data.next_cursor;
        // Store the cursor for 'newer' mode
        await storeCursor(supabase, 'newer', nextCursor);
      } else {
        console.log(`No next cursor available or reached cutoff, ending pagination at request ${i+1}`);
        break;
      }
      
      // Add a delay between requests to avoid rate limiting
      if (i < maxBatches - 1 && !reachedCutoff) {
        console.log('Waiting 1000ms before next request...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalFetched,
      totalStored,
      pagesProcessed,
      reachedCutoff,
      message: `Successfully fetched ${totalFetched} tweets (stored ${totalStored} new tweets) from ${pagesProcessed} pages${reachedCutoff ? ', reached cutoff date' : ''}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-newer-tweets function:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: "Error fetching newer tweets"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
