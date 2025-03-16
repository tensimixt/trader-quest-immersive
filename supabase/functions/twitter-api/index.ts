
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

  // Parse request
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'list';
  const cursor = url.searchParams.get('cursor');
  const cutoffDate = url.searchParams.get('cutoffDate');

  try {
    const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || 'cbd4102b6e7a4a5a95f9db1fd92c90e4';
    let apiUrl = 'https://api.twitterapi.io/twitter/list/tweets';
    
    // Add cursor if provided
    if (cursor) {
      apiUrl += `?cursor=${encodeURIComponent(cursor)}`;
    }
    
    console.log(`Making Twitter API request to: ${apiUrl}`);
    console.log(`Mode: ${mode}, Cursor: ${cursor}, Cutoff Date: ${cutoffDate}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': TWITTER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitter API error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Error fetching tweets from Twitter API',
          details: errorText,
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data = await response.json();
    
    // Process the tweets to a simpler format if needed
    const simplifiedTweets = data.tweets.map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.createdAt,
      author: {
        userName: tweet.author.userName,
        name: tweet.author.name,
        profilePicture: tweet.author.profilePicture
      },
      isReply: tweet.isReply,
      isQuote: tweet.quoted_tweet ? true : false,
      inReplyToId: tweet.inReplyToId,
      quoted_tweet: tweet.quoted_tweet ? {
        text: tweet.quoted_tweet.text,
        author: tweet.quoted_tweet.author ? {
          userName: tweet.quoted_tweet.author.userName
        } : undefined
      } : undefined
    }));

    // Include the cursor for pagination in the response
    return new Response(
      JSON.stringify({
        tweets: simplifiedTweets,
        cursor: data.cursor, // Pass through any cursor we get from the API
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
