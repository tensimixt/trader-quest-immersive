
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || '63b174ff7c2f44af89a86e7022509709';
// Twitter crypto list ID - using the correct list ID provided by the user
const TWITTER_LIST_ID = '1674940005557387266';
const MAX_REQUESTS = 100; // Maximum number of pages to fetch
const TWEETS_PER_REQUEST = 100; // Maximum allowed by Twitter API
const MAX_RETRIES = 3; // Maximum number of retries for API requests
const RETRY_DELAY = 1000; // Delay between retries in milliseconds
const DEFAULT_BATCH_SIZE = 20; // Increase default batch size to 20 since we get fewer tweets per page

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
    
    // If we get a 502 Bad Gateway or other 5xx error
    if ((response.status >= 500 && response.status < 600) && retries > 0) {
      console.log(`Received ${response.status} error, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1))); // Exponential backoff
      return fetchWithRetry(url, options, retries - 1);
    }
    
    if (!response.ok && retries > 0) {
      console.log(`Request failed with status ${response.status}, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1))); // Exponential backoff
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Request failed with error: ${error.message}, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1))); // Exponential backoff
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
    console.log('Historical tweets function called');
    
    const { cursor, batchSize = DEFAULT_BATCH_SIZE, startNew = false, mode = 'older', tweetsPerRequest = TWEETS_PER_REQUEST } = await req.json();
    // Ensure batchSize doesn't exceed our MAX_REQUESTS limit
    const actualBatchSize = Math.min(parseInt(batchSize), MAX_REQUESTS);
    
    // Allow customization of tweets per request, but ensure it doesn't exceed the maximum
    const actualTweetsPerRequest = Math.min(parseInt(tweetsPerRequest), TWEETS_PER_REQUEST);
    
    console.log(`Fetching historical tweets with batch size: ${actualBatchSize}, tweets per request: ${actualTweetsPerRequest}, starting cursor: ${cursor || 'initial'}, startNew: ${startNew}, mode: ${mode}`);
    
    // Create Supabase client for database operations
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Determine which cursor to use
    let nextCursor = cursor;
    
    // If no cursor provided but not starting new, get stored cursor from database
    if (!cursor && !startNew) {
      nextCursor = await getStoredCursor(supabase, mode);
      console.log(`Retrieved stored cursor for mode ${mode}: ${nextCursor || 'none found'}`);
    }
    
    let totalFetched = 0;
    let totalStored = 0;
    let latestCursor = null;
    let pagesProcessed = 0;
    let consecutiveErrors = 0;
    let emptyResultCount = 0; // Track empty results to handle API inconsistency
    let lowTweetCountPages = 0; // Track pages with very few tweets
    const expectedTweetsPerPage = 20; // Adjust our expectations - we typically get around 20 tweets per page
    
    for (let i = 0; i < actualBatchSize && pagesProcessed < MAX_REQUESTS; i++) {
      // Construct URL with pagination parameters
      let url = `https://api.twitterapi.io/twitter/list/tweets?listId=${TWITTER_LIST_ID}&count=${actualTweetsPerRequest}`;
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
          
          // If we've hit multiple consecutive errors, we should break the loop
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
            console.error(`Hit ${consecutiveErrors} consecutive errors, stopping batch processing`);
            break;
          }
          
          // Wait longer between requests if we're getting errors
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue; // Skip to the next iteration
        }
        
        // Reset consecutive errors on success
        consecutiveErrors = 0;
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
        
        consecutiveErrors++;
        if (consecutiveErrors >= 3) {
          console.error(`Hit ${consecutiveErrors} consecutive non-JSON responses, stopping batch processing`);
          break;
        }
        
        // Wait longer between requests if we're getting errors
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue; // Skip to the next iteration
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        consecutiveErrors++;
        if (consecutiveErrors >= 3) {
          console.error(`Hit ${consecutiveErrors} consecutive JSON parsing errors, stopping batch processing`);
          break;
        }
        continue;
      }
      
      pagesProcessed++;
      
      // Check if we have tweets in the response
      if (!data.tweets || !Array.isArray(data.tweets) || data.tweets.length === 0) {
        console.log(`No tweets returned in request ${i+1}`);
        emptyResultCount++;
        
        // If we've received 2 consecutive empty results, assume we've reached the end
        // even if has_next_page is true (handling Twitter API inconsistency)
        if (emptyResultCount >= 2) {
          console.log(`Received ${emptyResultCount} consecutive empty results, assuming end of data`);
          break;
        }
        
        // If there's a next cursor but no tweets, we'll try one more time
        if (data.next_cursor) {
          nextCursor = data.next_cursor;
          latestCursor = nextCursor;
          continue;
        } else {
          break;
        }
      }
      
      // Reset empty result count if we got tweets
      emptyResultCount = 0;
      
      // Track if we're getting significantly fewer tweets than expected
      if (data.tweets.length < expectedTweetsPerPage / 2) {
        lowTweetCountPages++;
        console.log(`Warning: Only received ${data.tweets.length} tweets, which is less than half of expected ${expectedTweetsPerPage}`);
        
        // If we get 3 consecutive pages with very few tweets, we might be approaching the end
        if (lowTweetCountPages >= 3) {
          console.log(`Multiple pages with very few tweets, might be approaching end of available data`);
          // We'll continue but log this warning
        }
      } else {
        // Reset the counter if we get a normal page
        lowTweetCountPages = 0;
      }
      
      console.log(`Fetched ${data.tweets.length} tweets in this page (expected around ${expectedTweetsPerPage})`);
      totalFetched += data.tweets.length;
      
      // Log if we have has_next_page value and what it is
      if (data.has_next_page !== undefined) {
        console.log(`API reports has_next_page: ${data.has_next_page}`);
      }
      
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
      
      // Check if we should stop due to no more data
      if (!nextCursor) {
        console.log(`No next cursor available, ending pagination at request ${i+1}`);
        break;
      }
      
      // Handle Twitter API inconsistency: If we have a next_cursor but very few tweets
      // or a page with no new tweets (totalStored didn't increase), we might be at the end
      if (data.tweets.length < 5 || (processedTweets.length > 0 && totalStored === 0)) {
        console.log(`Warning: Only ${data.tweets.length} tweets returned, or no new tweets stored. Might be approaching end of data`);
        emptyResultCount += 0.5; // Count low tweet counts as "half empty"
        
        if (emptyResultCount >= 2) {
          console.log(`Multiple requests with few or no tweets, assuming we're at the end`);
          break;
        }
      }
      
      // Check if we've hit our global page limit
      if (pagesProcessed >= MAX_REQUESTS) {
        console.log(`Reached maximum page limit of ${MAX_REQUESTS}. Stopping further requests.`);
        break;
      }
      
      // Adaptively adjust the delay between requests based on the number of tweets received
      // If we got fewer tweets than expected, the API might be rate limiting us
      const delayMultiplier = data.tweets.length < (expectedTweetsPerPage / 2) ? 1.5 : 1; 
      const baseDelay = 1000; // 1 second base delay
      const delay = Math.round(baseDelay * delayMultiplier);
      
      if (i < actualBatchSize - 1) {
        console.log(`Waiting ${delay}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Store the latest cursor for future use, only if we had a successful fetch
    if (latestCursor) {
      await storeCursor(supabase, mode, latestCursor);
    }

    return new Response(JSON.stringify({
      success: true,
      totalFetched,
      totalStored,
      nextCursor: latestCursor,
      pagesProcessed,
      message: `Successfully fetched ${totalFetched} historical tweets (stored ${totalStored} new/updated tweets) from ${pagesProcessed} pages`,
      cursorMode: mode,
      isAtEnd: emptyResultCount >= 1.5 || lowTweetCountPages >= 3 // Indicate if we might be at the end of available data
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
