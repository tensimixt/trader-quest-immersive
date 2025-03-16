
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a single Supabase client for interacting with the database
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define interface for the response
interface FetchResponse {
  success: boolean;
  error?: string;
  totalFetched: number;
  totalStored: number;
  pagesProcessed: number;
  nextCursor?: string;
  isAtEnd: boolean;
  reachedCutoff: boolean;
}

// Helper function to normalize tweets for storage
const normalizeTweet = (tweet: any) => ({
  id: tweet.id,
  text: tweet.text,
  createdAt: tweet.createdAt,
  author: {
    userName: tweet.author?.userName || "unknown",
    name: tweet.author?.name || "Unknown User",
    profilePicture: tweet.author?.profilePicture || "https://pbs.twimg.com/profile_images/1608560432897314823/ErsxYIuW_normal.jpg"
  },
  isReply: tweet.isReply || false,
  isQuote: tweet.quoted_tweet ? true : false,
  inReplyToId: tweet.inReplyToId,
  quoted_tweet: tweet.quoted_tweet ? {
    text: tweet.quoted_tweet.text,
    author: tweet.quoted_tweet.author ? {
      userName: tweet.quoted_tweet.author.userName
    } : undefined
  } : undefined,
  entities: tweet.entities || { media: [] },
  extendedEntities: tweet.extendedEntities || { media: [] }
});

// Helper function to store tweets in the database
const storeTweetsInDatabase = async (tweets: any[], cutoffTimestamp: number) => {
  // Filter tweets to only include ones newer than the cutoff date
  const filteredTweets = tweets.filter(tweet => {
    const tweetDate = new Date(tweet.createdAt);
    const tweetTimestamp = tweetDate.getTime();
    return tweetTimestamp > cutoffTimestamp;
  });
  
  if (filteredTweets.length === 0) {
    console.log('No tweets to store after filtering by cutoff date');
    return 0;
  }
  
  const normalizedTweets = filteredTweets.map(normalizeTweet);
  
  // Store tweets in historical_tweets table using upsert
  const { data: storedData, error: storageError } = await supabase
    .from('historical_tweets')
    .upsert(
      normalizedTweets.map((tweet: any) => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.createdAt,
        author: tweet.author,
        is_reply: tweet.isReply,
        is_quote: tweet.isQuote,
        in_reply_to_id: tweet.inReplyToId,
        quoted_tweet: tweet.quoted_tweet,
        entities: tweet.entities,
        extended_entities: tweet.extendedEntities
      })),
      { onConflict: 'id' }
    );

  if (storageError) {
    console.error('Error storing tweets:', storageError);
    return 0;
  }
  
  return normalizedTweets.length;
};

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cursor, batchSize = 10, cutoffDate, firstBatchOnly = false } = await req.json();
    
    if (!cutoffDate) {
      throw new Error('Missing required parameter: cutoffDate');
    }

    const cutoffTimestamp = new Date(cutoffDate).getTime();
    if (isNaN(cutoffTimestamp)) {
      throw new Error('Invalid cutoff date format');
    }

    console.log(`Starting fetch operation with parameters:
      - Cursor: ${cursor || 'None (starting fresh)'}
      - Batch Size: ${batchSize}
      - Cutoff Date: ${cutoffDate} (${cutoffTimestamp})
      - First Batch Only: ${firstBatchOnly ? 'Yes' : 'No'}
    `);

    // Initialize tracking variables
    let totalTweetsFetched = 0;
    let totalTweetsStored = 0;
    let pagesProcessed = 0;
    let isAtEnd = false;
    let nextCursor = cursor;
    let reachedCutoff = false;

    // Retrieve API key - use a default if needed for development or fallback
    const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || 'cbd4102b6e7a4a5a95f9db1fd92c90e4'; // Fallback to public API key
    if (!TWITTER_API_KEY) {
      throw new Error('TWITTER_API_KEY is not configured');
    }

    // Process tweets in batches
    for (let batch = 0; batch < batchSize; batch++) {
      // If firstBatchOnly is true and this is not the first batch, break
      if (firstBatchOnly && batch > 0) {
        console.log(`First batch only mode: Stopping after batch 1`);
        break;
      }
      
      let apiUrl = 'https://api.twitterapi.io/twitter/list/tweets';
      
      if (nextCursor) {
        apiUrl += `?cursor=${encodeURIComponent(nextCursor)}`;
      }
      
      console.log(`Batch ${batch + 1}/${batchSize}: Fetching from ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': TWITTER_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}): ${errorText}`);
        
        // If we've already processed some data, return partial success
        if (totalTweetsFetched > 0) {
          break;
        } else {
          throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      if (!data.tweets || !Array.isArray(data.tweets) || data.tweets.length === 0) {
        console.log('No tweets returned or empty array');
        isAtEnd = true;
        break;
      }

      // Update the cursor for the next iteration
      nextCursor = data.cursor;
      
      // Check if any tweets are older than the cutoff date
      for (const tweet of data.tweets) {
        const tweetDate = new Date(tweet.createdAt);
        const tweetTimestamp = tweetDate.getTime();
        
        if (tweetTimestamp <= cutoffTimestamp) {
          console.log(`Found tweet (${tweet.id}) from ${tweetDate.toISOString()} which is at or before cutoff date`);
          reachedCutoff = true;
          break;
        }
      }
      
      // Process and store tweets
      const tweetsStoredInBatch = await storeTweetsInDatabase(data.tweets, cutoffTimestamp);
      console.log(`Stored ${tweetsStoredInBatch} tweets in batch ${batch + 1}`);
      totalTweetsStored += tweetsStoredInBatch;
      totalTweetsFetched += data.tweets.length;
      pagesProcessed++;
      
      // Update the cursor in the database
      if (nextCursor) {
        const { error: cursorError } = await supabase
          .from('twitter_cursors')
          .upsert(
            { cursor_type: 'newer', cursor_value: nextCursor },
            { onConflict: 'cursor_type' }
          );

        if (cursorError) {
          console.error('Error storing cursor:', cursorError);
        } else {
          console.log(`Updated 'newer' cursor to: ${nextCursor}`);
        }
      }

      // Stop if we've reached the cutoff date or there's no more pagination
      if (reachedCutoff || !nextCursor) {
        break;
      }
      
      // Add a small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const result: FetchResponse = {
      success: true,
      totalFetched: totalTweetsFetched,
      totalStored: totalTweetsStored,
      pagesProcessed,
      nextCursor,
      isAtEnd,
      reachedCutoff
    };

    console.log('Operation complete:', result);

    // Return the result
    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        totalFetched: 0,
        totalStored: 0,
        pagesProcessed: 0,
        isAtEnd: false,
        reachedCutoff: false
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
