
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

  // Parse URL to get parameters
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'fetch';
  const targetCursor = url.searchParams.get('targetCursor');

  try {
    const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || 'cbd4102b6e7a4a5a95f9db1fd92c90e4';
    
    // Create Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zzbftruhrjfmynhamypk.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get Latest Cursor Mode - Fetch latest tweets and their cursor
    if (mode === 'get-cursor') {
      // Fetch the latest tweets to get current cursor
      const apiUrl = new URL('https://api.twitterapi.io/twitter/list/tweets');
      apiUrl.searchParams.append('listId', '1674940005557387266'); // Crypto list ID
      
      const response = await fetch(apiUrl.toString(), {
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
            success: false,
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
      const latestCursor = data.next_cursor;
      
      // Also get our stored newer cursor
      const { data: newerCursor, error: cursorError } = await supabase
        .from('twitter_cursors')
        .select('cursor_value')
        .eq('cursor_type', 'newer')
        .single();
      
      return new Response(
        JSON.stringify({
          success: true,
          latest_cursor: latestCursor,
          stored_cursor: newerCursor?.cursor_value || null
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    // Fetch and Store Mode - Fetch newer tweets and store them in the database
    else if (mode === 'fetch-and-store') {
      let currentCursor = null;
      
      // Get the current cursor from request body if it's a POST request
      if (req.method === 'POST') {
        const body = await req.json();
        currentCursor = body.currentCursor;
      }
      
      // If no cursor in the request, try to get the stored 'newer' cursor
      if (!currentCursor) {
        const { data: newerCursor, error: cursorError } = await supabase
          .from('twitter_cursors')
          .select('cursor_value')
          .eq('cursor_type', 'newer')
          .single();
        
        if (!cursorError && newerCursor) {
          currentCursor = newerCursor.cursor_value;
        }
      }
      
      // Fetch tweets from Twitter API, optionally using cursor
      const apiUrl = new URL('https://api.twitterapi.io/twitter/list/tweets');
      apiUrl.searchParams.append('listId', '1674940005557387266'); // Crypto list ID
      
      if (currentCursor) {
        apiUrl.searchParams.append('cursor', currentCursor);
      }
      
      const response = await fetch(apiUrl.toString(), {
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
            success: false,
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
      let reachedTarget = false;
      
      // Check if we've reached the target cursor
      if (targetCursor && data.next_cursor === targetCursor) {
        reachedTarget = true;
      }
      
      // Process the tweets and store them in the historical_tweets table
      let tweetsStored = 0;
      
      if (data.tweets && Array.isArray(data.tweets)) {
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
          fetched_at: new Date()
        }));
        
        if (processedTweets.length > 0) {
          // Store the tweets in the database
          const { error: insertError, count } = await supabase
            .from('historical_tweets')
            .upsert(processedTweets, { 
              onConflict: 'id',
              count: 'exact'
            });
          
          if (insertError) {
            console.error('Error storing tweets in database:', insertError);
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Error storing tweets in database',
                details: insertError.message,
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
          
          tweetsStored = count || 0;
          
          // Update the cursor for future requests if provided
          if (data.next_cursor) {
            const { error: updateError } = await supabase
              .from('twitter_cursors')
              .upsert(
                { 
                  cursor_type: 'newer', 
                  cursor_value: data.next_cursor,
                  updated_at: new Date().toISOString()
                },
                { onConflict: 'cursor_type' }
              );
            
            if (updateError) {
              console.error('Error updating cursor:', updateError);
            }
          }
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          tweetsProcessed: data.tweets?.length || 0,
          tweetsStored,
          nextCursor: data.next_cursor,
          reachedTarget,
          targetCursor
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      // Standard tweet fetch mode (original functionality)
      const url = 'https://api.twitterapi.io/twitter/list/tweets';
      
      const response = await fetch(url, {
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

      return new Response(
        JSON.stringify({ tweets: simplifiedTweets }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
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
