
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zzbftruhrjfmynhamypk.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Fetching recent tweets from historical_tweets table');
    // Fetch the most recent tweets from the historical_tweets table
    const { data: tweets, error } = await supabase
      .from('historical_tweets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error fetching tweets from database:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error fetching tweets from database',
          details: error.message,
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
    
    // Transform the tweets to match the expected format
    const formattedTweets = tweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at,
      author: {
        userName: tweet.author_username,
        name: tweet.author_name,
        profilePicture: tweet.author_profile_picture
      },
      isReply: tweet.is_reply,
      isQuote: tweet.is_quote,
      inReplyToId: tweet.in_reply_to_id,
      quoted_tweet: tweet.quoted_tweet_text ? {
        text: tweet.quoted_tweet_text,
        author: {
          userName: tweet.quoted_tweet_author,
          name: tweet.quoted_tweet_author
        }
      } : undefined,
      entities: tweet.entities,
      extendedEntities: tweet.extended_entities
    }));

    console.log(`Returning ${formattedTweets.length} tweets`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        tweets: formattedTweets,
        totalCount: tweets.length
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Server error:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        details: error.message,
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
