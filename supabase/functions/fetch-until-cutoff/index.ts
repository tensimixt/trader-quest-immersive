
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

// Function to format date in UTC format
function formatUtcTime(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  
  // Format: "yyyy-MM-dd HH:mm:ss+00:00"
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}+00:00`;
}

// Function to fetch the latest tweet date from the database
async function fetchLatestTweetDate(): Promise<string> {
  console.log('Fetching latest tweet date from database...');
  
  try {
    const { data, error } = await supabase
      .from('historical_tweets')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching latest tweet date:', error);
      // Return a default cutoff date (e.g., current date)
      return formatUtcTime(new Date());
    }
    
    if (data && data.created_at) {
      const latestDate = new Date(data.created_at);
      const formattedDate = formatUtcTime(latestDate);
      console.log('Latest tweet date found:', formattedDate);
      return formattedDate;
    } else {
      console.log('No tweets found in database. Using current date as cutoff.');
      return formatUtcTime(new Date());
    }
  } catch (error) {
    console.error('Error in fetchLatestTweetDate:', error);
    // Return current date as fallback
    return formatUtcTime(new Date());
  }
}

// Helper function to store tweets in the database
async function storeTweetsInDatabase(tweets) {
  if (!tweets || tweets.length === 0) {
    console.log('No tweets to store');
    return { count: 0, error: null };
  }
  
  console.log(`Attempting to store ${tweets.length} tweets in the database`);
  
  // Normalize the tweets for storage
  const normalizedTweets = tweets.map(tweet => ({
    id: tweet.id,
    text: tweet.text,
    created_at: new Date(tweet.createdAt),
    author_username: tweet.author?.userName || "unknown",
    author_name: tweet.author?.name || "Unknown User",
    author_profile_picture: tweet.author?.profilePicture || null,
    is_reply: !!tweet.isReply,
    is_quote: !!tweet.isQuote,
    in_reply_to_id: tweet.inReplyToId,
    quoted_tweet_id: tweet.quoted_tweet?.id,
    quoted_tweet_text: tweet.quoted_tweet?.text,
    quoted_tweet_author: tweet.quoted_tweet?.author?.userName,
    entities: tweet.entities || {},
    extended_entities: tweet.extendedEntities || {}
  }));
  
  // Store the tweets using upsert to avoid duplicates
  const { error, count } = await supabase
    .from('historical_tweets')
    .upsert(normalizedTweets, { 
      onConflict: 'id',
      count: 'exact' // Get the exact count of affected rows
    });
  
  if (error) {
    console.error('Error storing tweets in database:', error);
  } else {
    console.log(`Successfully stored/updated ${count} tweets in the database`);
  }
  
  return { count: count || 0, error };
}

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request parameters (if any)
    let params = {};
    if (req.method === 'POST') {
      try {
        params = await req.json();
      } catch (e) {
        // If parsing fails, use empty object
        console.log('Failed to parse request body as JSON, using default parameters');
      }
    }
    
    // Extract parameters with defaults
    const { cursor = null, batchSize = 10 } = params;
    
    // Fetch the latest tweet date from the database to use as cutoff
    const cutoffDate = await fetchLatestTweetDate();
    console.log(`Using dynamic cutoff date: ${cutoffDate}`);
    
    const cutoffTimestamp = new Date(cutoffDate).getTime();
    if (isNaN(cutoffTimestamp)) {
      throw new Error('Invalid cutoff date format');
    }

    console.log(`Starting fetch operation with parameters:
      - Cursor: ${cursor || 'None (starting fresh)'}
      - Batch Size: ${batchSize}
      - Cutoff Date: ${cutoffDate} (${cutoffTimestamp})
    `);

    // Initialize tracking variables
    let totalTweetsFetched = 0;
    let totalTweetsStored = 0;
    let pagesProcessed = 0;
    let isAtEnd = false;
    let nextCursor = cursor;
    let reachedCutoff = false;

    const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || '';
    if (!TWITTER_API_KEY) {
      throw new Error('TWITTER_API_KEY is not configured');
    }

    // Process tweets in batches
    for (let batch = 0; batch < batchSize; batch++) {
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
      let tweetsToProcess = [];
      let foundCutoff = false;
      
      for (const tweet of data.tweets) {
        const tweetDate = new Date(tweet.createdAt);
        const tweetTimestamp = tweetDate.getTime();
        
        // Only include tweets newer than the cutoff date
        if (tweetTimestamp > cutoffTimestamp) {
          tweetsToProcess.push(tweet);
        } else {
          console.log(`Found tweet (${tweet.id}) from ${tweetDate.toISOString()} which is at or before cutoff date`);
          foundCutoff = true;
          reachedCutoff = true;
          // We don't break here, to ensure we process all newer tweets from this batch
        }
      }
      
      // Process and store tweets that are newer than the cutoff
      if (tweetsToProcess.length > 0) {
        const { count, error } = await storeTweetsInDatabase(tweetsToProcess);
        
        if (!error) {
          console.log(`Stored ${count} tweets in batch ${batch + 1}`);
          totalTweetsStored += count;
        }
      } else {
        console.log(`No tweets newer than cutoff date in batch ${batch + 1}`);
      }
      
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
      if (foundCutoff || !nextCursor) {
        if (foundCutoff) {
          console.log('Reached cutoff date, stopping further requests');
        } else {
          console.log('No pagination cursor returned, stopping');
        }
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
