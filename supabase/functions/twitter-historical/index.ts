
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || '63b174ff7c2f44af89a86e7022509709';
// Twitter crypto list ID - using the correct list ID provided by the user
const TWITTER_LIST_ID = '1674940005557387266';
const MAX_REQUESTS = 100; // Maximum number of pages to fetch
const TWEETS_PER_REQUEST = 100; // Maximum allowed by Twitter API
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Historical tweets function called');
    
    const { cursor, batchSize = 1, startNew = false } = await req.json();
    // Ensure batchSize doesn't exceed our MAX_REQUESTS limit
    const actualBatchSize = Math.min(parseInt(batchSize), MAX_REQUESTS);
    
    console.log(`Fetching historical tweets with batch size: ${actualBatchSize}, starting cursor: ${cursor || 'initial'}, startNew: ${startNew}`);
    
    // Create Supabase client for database operations
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // If startNew is true, get the most recent tweets
    // Otherwise, use the provided cursor or find the oldest tweet's cursor
    let nextCursor = cursor;
    
    if (!cursor && !startNew) {
      // Find the oldest tweet we've stored to get its cursor for pagination
      const { data: oldestTweet, error: findError } = await supabase
        .from('historical_tweets')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (findError) {
        console.error('Error finding oldest tweet:', findError);
      } else if (oldestTweet && oldestTweet.length > 0) {
        // Use the oldest tweet ID to build a position cursor
        console.log(`Found oldest tweet ID: ${oldestTweet[0].id}`);
      }
    }
    
    let totalFetched = 0;
    let totalStored = 0;
    let latestCursor = null;
    let pagesProcessed = 0;
    
    for (let i = 0; i < actualBatchSize && pagesProcessed < MAX_REQUESTS; i++) {
      // Construct URL with pagination parameters
      let url = `https://api.twitterapi.io/twitter/list/tweets?listId=${TWITTER_LIST_ID}&count=${TWEETS_PER_REQUEST}`;
      if (nextCursor) {
        url += `&cursor=${nextCursor}`;
      }
      
      console.log(`Request ${i+1}/${actualBatchSize}, URL: ${url}`);
      
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
          console.error(`Twitter API error on request ${i+1}:`, errorText, 'Status:', response.status);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.error(`Failed to fetch tweets after retries: ${error.message}`);
        // If we've already processed some tweets, don't fail the entire request
        if (pagesProcessed > 0) {
          break;
        }
        throw error;
      }

      // Check if the response has the correct content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response from Twitter API:', responseText);
        
        // If we've already processed some tweets, don't fail the entire request
        if (pagesProcessed > 0) {
          break;
        }
        throw new Error('API returned non-JSON response');
      }

      const data = await response.json();
      pagesProcessed++;
      
      // Check if we have tweets in the response
      if (!data.tweets || !Array.isArray(data.tweets) || data.tweets.length === 0) {
        console.log(`No tweets returned in request ${i+1}`);
        break;
      }
      
      console.log(`Fetched ${data.tweets.length} tweets`);
      totalFetched += data.tweets.length;
      
      // Process tweets for storage - filter out tweets that already exist in the database
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
          // Continue with the next batch even if there's an error
        } else {
          console.log(`Successfully stored ${count} tweets in the database`);
          totalStored += count || 0;
        }
      }
      
      // Update cursor for next page if available
      nextCursor = data.next_cursor;
      latestCursor = nextCursor;
      
      if (!nextCursor) {
        console.log(`No next cursor available, ending pagination at request ${i+1}`);
        break;
      }
      
      // Check if we've hit our global page limit
      if (pagesProcessed >= MAX_REQUESTS) {
        console.log(`Reached maximum page limit of ${MAX_REQUESTS}. Stopping further requests.`);
        break;
      }
      
      // Add a small delay between requests to avoid rate limiting
      if (i < actualBatchSize - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalFetched,
      totalStored,
      nextCursor: latestCursor,
      pagesProcessed,
      message: `Successfully fetched ${totalFetched} historical tweets (stored ${totalStored} new/updated tweets) from ${pagesProcessed} pages`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in historical tweets function:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: "Error fetching historical tweets"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
