
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
}

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting fetch-new operation');

    // Initialize tracking variables
    let totalTweetsFetched = 0;
    let totalTweetsStored = 0;

    const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || '';
    if (!TWITTER_API_KEY) {
      throw new Error('TWITTER_API_KEY is not configured');
    }

    // Make a single API call without using a cursor
    const apiUrl = 'https://api.twitterapi.io/twitter/list/tweets';
    
    console.log(`Fetching from ${apiUrl}`);
    
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
      throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.tweets || !Array.isArray(data.tweets) || data.tweets.length === 0) {
      console.log('No tweets returned or empty array');
      throw new Error('No tweets returned from the API');
    }

    console.log(`Retrieved ${data.tweets.length} tweets from API`);
    
    // Process and store tweets
    const normalizedTweets = data.tweets.map((tweet: any) => ({
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
    }));

    totalTweetsFetched = normalizedTweets.length;

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
      throw new Error(`Error storing tweets: ${storageError.message}`);
    } else {
      console.log(`Stored ${normalizedTweets.length} tweets`);
      totalTweetsStored = normalizedTweets.length;
    }

    // Store the cursor if available
    if (data.cursor) {
      const { error: cursorError } = await supabase
        .from('twitter_cursors')
        .upsert(
          { cursor_type: 'newer', cursor_value: data.cursor },
          { onConflict: 'cursor_type' }
        );

      if (cursorError) {
        console.error('Error storing cursor:', cursorError);
      } else {
        console.log(`Updated 'newer' cursor to: ${data.cursor}`);
      }
    }

    const result: FetchResponse = {
      success: true,
      totalFetched: totalTweetsFetched,
      totalStored: totalTweetsStored
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
        totalStored: 0
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
