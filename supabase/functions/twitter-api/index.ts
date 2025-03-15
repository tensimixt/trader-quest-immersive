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
    // Fetch by Timestamp Mode - Fetch tweets until we reach the timestamp of the most recent stored tweet
    else if (mode === 'fetch-by-timestamp') {
      console.log('Starting timestamp-based tweet fetch operation');
      
      // First, get the timestamp of the most recent tweet in our database
      const { data: latestTweet, error: latestTweetError } = await supabase
        .from('historical_tweets')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (latestTweetError) {
        console.error('Error fetching latest tweet timestamp:', latestTweetError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Error fetching latest tweet timestamp',
            details: latestTweetError.message,
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
      
      const latestTweetDate = latestTweet && latestTweet.length > 0 ? new Date(latestTweet[0].created_at) : null;
      console.log('Latest tweet date in database:', latestTweetDate ? latestTweetDate.toISOString() : 'No tweets found');
      
      if (!latestTweetDate) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No tweets found in database',
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
      let batchesProcessed = 0;
      let totalTweetsStored = 0;
      let isComplete = false;
      let currentCursor = null;
      const MAX_BATCHES = 10;
      
      while (!isComplete && batchesProcessed < MAX_BATCHES) {
        console.log(`Processing batch #${batchesProcessed + 1}, current cursor: ${currentCursor}`);
        
        // Fetch tweets from Twitter API
        const apiUrl = new URL('https://api.twitterapi.io/twitter/list/tweets');
        apiUrl.searchParams.append('listId', '1674940005557387266');
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
          console.error(`Error fetching batch #${batchesProcessed + 1}:`, errorText);
          break;
        }
        
        const data = await response.json();
        const tweets = data.tweets || [];
        currentCursor = data.next_cursor;
        
        batchesProcessed++;
        
        if (tweets.length === 0) {
          console.log('No tweets in this batch, reached end of available tweets');
          isComplete = true;
          break;
        }
        
        // Process tweets and check timestamps
        const processedTweets = tweets.map((tweet: any) => ({
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
        
        // Check if we've reached tweets older than our latest stored tweet
        const oldestTweetInBatch = new Date(Math.min(...processedTweets.map(t => t.created_at.getTime())));
        console.log('Oldest tweet in batch:', oldestTweetInBatch.toISOString());
        console.log('Latest tweet in DB:', latestTweetDate.toISOString());
        
        if (oldestTweetInBatch <= latestTweetDate) {
          console.log('Reached tweets older than or equal to our latest stored tweet, stopping');
          isComplete = true;
        }
        
        // Store new tweets
        const { error: insertError, count } = await supabase
          .from('historical_tweets')
          .upsert(processedTweets, { 
            onConflict: 'id',
            count: 'exact'
          });
        
        if (insertError) {
          console.error('Error storing tweets:', insertError);
          break;
        }
        
        totalTweetsStored += count || 0;
        console.log(`Stored ${count} new tweets from batch #${batchesProcessed}`);
        
        if (!currentCursor) {
          console.log('No next cursor, reached end of available tweets');
          isComplete = true;
          break;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`Timestamp-based fetch complete. Stored ${totalTweetsStored} new tweets in ${batchesProcessed} batches`);
      
      return new Response(
        JSON.stringify({
          success: true,
          tweetsStored: totalTweetsStored,
          batchesProcessed,
          isComplete,
          latestTweetDate: latestTweetDate.toISOString(),
          message: `Processed ${batchesProcessed} batches and stored ${totalTweetsStored} new tweets up to ${latestTweetDate.toISOString()}`
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    // Smart Newer Tweets Mode - Fetch newer tweets with duplicate detection
    else if (mode === 'fetch-newer-smart') {
      console.log('Starting smart newer tweet fetch operation');
      
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
      const latestTweets = data.tweets || [];
      
      // Get most recent tweet IDs from our database to detect duplicates
      const { data: recentTweetIds, error: recentError } = await supabase
        .from('historical_tweets')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (recentError) {
        console.error('Error fetching recent tweets from database:', recentError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Error fetching recent tweets from database',
            details: recentError.message,
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
      
      // Create a set of existing tweet IDs for fast lookup
      const existingTweetIds = new Set(recentTweetIds?.map(t => t.id) || []);
      console.log(`Found ${existingTweetIds.size} recent tweets in database for comparison`);
      
      let batchesProcessed = 1;
      let totalProcessed = 0;
      let totalStored = 0;
      let isComplete = false;
      let duplicatesFound = 0;
      let currentCursor = latestCursor;
      const MAX_BATCHES = 10; // Safety limit
      
      // Process the initial batch of tweets
      if (latestTweets && latestTweets.length > 0) {
        // Filter out tweets that are already in our database
        const newTweets = latestTweets.filter(tweet => !existingTweetIds.has(tweet.id));
        duplicatesFound += (latestTweets.length - newTweets.length);
        
        console.log(`Initial batch: ${latestTweets.length} tweets, ${newTweets.length} new, ${duplicatesFound} duplicates`);
        totalProcessed += latestTweets.length;
        
        if (newTweets.length > 0) {
          const processedTweets = newTweets.map(tweet => ({
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
          
          // Store the new tweets
          const { error: insertError, count } = await supabase
            .from('historical_tweets')
            .upsert(processedTweets, { 
              onConflict: 'id',
              count: 'exact'
            });
          
          if (insertError) {
            console.error('Error storing tweets in database:', insertError);
          } else {
            totalStored += count || 0;
            console.log(`Stored ${count} new tweets in database`);
          }
          
          // Update the cursor for future requests
          if (currentCursor) {
            const { error: updateError } = await supabase
              .from('twitter_cursors')
              .upsert(
                { 
                  cursor_type: 'newer', 
                  cursor_value: currentCursor,
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
      
      // If we found a significant number of duplicates, we're likely caught up
      // or if there are no new tweets, we're also caught up
      if (duplicatesFound > Math.max(1, latestTweets.length * 0.5) || newTweets.length === 0) {
        isComplete = true;
        console.log('Found significant duplicates or no new tweets, considering operation complete');
      }
      
      // Continue fetching if not complete and we have a cursor and we haven't hit the batch limit
      while (!isComplete && currentCursor && batchesProcessed < MAX_BATCHES) {
        console.log(`Fetching additional batch #${batchesProcessed + 1} with cursor: ${currentCursor}`);
        
        // Fetch the next batch
        const nextUrl = new URL('https://api.twitterapi.io/twitter/list/tweets');
        nextUrl.searchParams.append('listId', '1674940005557387266');
        nextUrl.searchParams.append('cursor', currentCursor);
        
        const nextResponse = await fetch(nextUrl.toString(), {
          method: 'GET',
          headers: {
            'X-API-Key': TWITTER_API_KEY,
            'Content-Type': 'application/json',
          },
        });
        
        if (!nextResponse.ok) {
          console.error(`Error fetching batch #${batchesProcessed + 1}:`, await nextResponse.text());
          break;
        }
        
        const nextData = await nextResponse.json();
        const nextTweets = nextData.tweets || [];
        
        batchesProcessed++;
        totalProcessed += nextTweets.length;
        
        // Update cursor for next iteration if provided
        if (nextData.next_cursor) {
          currentCursor = nextData.next_cursor;
        } else {
          isComplete = true;
          console.log('No next cursor, reached end of available tweets');
          break;
        }
        
        // If no tweets in this batch, we're done
        if (nextTweets.length === 0) {
          isComplete = true;
          console.log('No tweets in this batch, reached end of available tweets');
          break;
        }
        
        // Filter out tweets that are already in our database
        // Also add any new tweet IDs to our existingTweetIds set
        const newTweets = nextTweets.filter(tweet => !existingTweetIds.has(tweet.id));
        nextTweets.forEach(tweet => existingTweetIds.add(tweet.id));
        
        const batchDuplicates = nextTweets.length - newTweets.length;
        duplicatesFound += batchDuplicates;
        
        console.log(`Batch #${batchesProcessed}: ${nextTweets.length} tweets, ${newTweets.length} new, ${batchDuplicates} duplicates`);
        
        // If this batch has a significant number of duplicates, we can stop
        if (batchDuplicates > Math.max(1, nextTweets.length * 0.5)) {
          console.log('Found significant duplicates in this batch, considering operation complete');
          isComplete = true;
        }
        
        // Process and store the new tweets
        if (newTweets.length > 0) {
          const processedTweets = newTweets.map(tweet => ({
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
          
          // Store the new tweets
          const { error: insertError, count } = await supabase
            .from('historical_tweets')
            .upsert(processedTweets, { 
              onConflict: 'id',
              count: 'exact'
            });
          
          if (insertError) {
            console.error('Error storing tweets in database:', insertError);
          } else {
            totalStored += count || 0;
            console.log(`Stored ${count} new tweets in database from batch #${batchesProcessed}`);
          }
          
          // Update the cursor for future requests
          const { error: updateError } = await supabase
            .from('twitter_cursors')
            .upsert(
              { 
                cursor_type: 'newer', 
                cursor_value: currentCursor,
                updated_at: new Date().toISOString()
              },
              { onConflict: 'cursor_type' }
            );
          
          if (updateError) {
            console.error('Error updating cursor:', updateError);
          }
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`Smart tweet fetch complete. Processed ${totalProcessed} tweets, stored ${totalStored} new tweets in ${batchesProcessed} batches`);
      
      return new Response(
        JSON.stringify({
          success: true,
          tweetsStored: totalStored,
          batchesProcessed,
          isComplete,
          duplicatesFound,
          totalProcessed,
          message: `Processed ${totalProcessed} tweets across ${batchesProcessed} batches and stored ${totalStored} new tweets`
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
