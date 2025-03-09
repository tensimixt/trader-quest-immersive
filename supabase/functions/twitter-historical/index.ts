import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || '63b174ff7c2f44af89a86e7022509709';
// Twitter crypto list ID - using the correct list ID provided by the user
const TWITTER_LIST_ID = '1674940005557387266';
const MAX_REQUESTS = 10; // Limit the number of paginated requests to avoid timeouts
const TWEETS_PER_REQUEST = 100; // Maximum allowed by Twitter API

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the X-Client-Info headers
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zzbftruhrjfmynhamypk.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Historical tweets function called');
    
    const { cursor, batchSize = 1, startNew = false } = await req.json();
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
        // This is a simplified approach - Twitter API may require specific cursor format
        console.log(`Found oldest tweet ID: ${oldestTweet[0].id}`);
      }
    }
    
    let totalFetched = 0;
    let latestCursor = null;
    
    for (let i = 0; i < actualBatchSize; i++) {
      // Construct URL with pagination parameters
      let url = `https://api.twitterapi.io/twitter/list/tweets?listId=${TWITTER_LIST_ID}&count=${TWEETS_PER_REQUEST}`;
      if (nextCursor) {
        url += `&cursor=${nextCursor}`;
      }
      
      console.log(`Request ${i+1}/${actualBatchSize}, URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': TWITTER_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Twitter API error on request ${i+1}:`, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.tweets || !Array.isArray(data.tweets) || data.tweets.length === 0) {
        console.log(`No more tweets to fetch at request ${i+1}`);
        break;
      }
      
      console.log(`Fetched ${data.tweets.length} tweets`);
      totalFetched += data.tweets.length;
      
      // Process tweets for storage
      const processedTweets = data.tweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        created_at: new Date(tweet.createdAt),
        author_username: tweet.author?.userName || "unknown",
        author_name: tweet.author?.name,
        author_profile_picture: tweet.author?.profilePicture,
        is_reply: !!tweet.isReply,
        is_quote: !!tweet.quoted_tweet,
        in_reply_to_id: tweet.inReplyToId,
        quoted_tweet_id: tweet.quoted_tweet?.id,
        quoted_tweet_text: tweet.quoted_tweet?.text,
        quoted_tweet_author: tweet.quoted_tweet?.author?.userName,
        entities: tweet.entities || {},
        extended_entities: tweet.extendedEntities || {},
      }));
      
      // Store tweets in the database
      if (processedTweets.length > 0) {
        const { error } = await supabase
          .from('historical_tweets')
          .upsert(processedTweets, { onConflict: 'id' });
        
        if (error) {
          console.error('Error storing tweets in database:', error);
          // Continue with the next batch even if there's an error
        } else {
          console.log(`Successfully stored ${processedTweets.length} tweets in the database`);
        }
      }
      
      // Update cursor for next page if available
      nextCursor = data.cursor;
      latestCursor = nextCursor;
      
      if (!nextCursor) {
        console.log(`No next cursor available, ending pagination at request ${i+1}`);
        break;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalFetched,
      nextCursor: latestCursor,
      message: `Successfully fetched and stored ${totalFetched} historical tweets`
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
