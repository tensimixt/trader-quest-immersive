
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      cursor,
      batchSize = 20,
      startNew = false,
      mode = 'older',
      tweetsPerRequest = 20,
      cutoffDate = null
    } = await req.json();

    console.log(`Params: cursor=${cursor}, batchSize=${batchSize}, startNew=${startNew}, mode=${mode}, tweetsPerRequest=${tweetsPerRequest}, cutoffDate=${cutoffDate}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zzbftruhrjfmynhamypk.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || 'cbd4102b6e7a4a5a95f9db1fd92c90e4';
    let apiUrl = 'https://api.twitterapi.io/twitter/list/tweets?listId=1339275591813943299';

    if (cursor && !startNew) {
      apiUrl += `&cursor=${encodeURIComponent(cursor)}`;
    }

    let totalFetched = 0;
    let pagesProcessed = 0;
    let reachedCutoff = false;

    const fetchAndProcessTweets = async (apiUrl: string) => {
      console.log(`Making Twitter API request to: ${apiUrl}`);

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
        throw new Error(`Twitter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.tweets || !Array.isArray(data.tweets)) {
        console.warn('No tweets returned or invalid format');
        return [];
      }

      return data.tweets;
    };

    let allTweets: any[] = [];
    let currentCursor = cursor;

    while (totalFetched < batchSize && !reachedCutoff) {
      try {
        let currentApiUrl = apiUrl;
        if (currentCursor && !startNew) {
          currentApiUrl = 'https://api.twitterapi.io/twitter/list/tweets?listId=1339275591813943299' + `&cursor=${encodeURIComponent(currentCursor)}`;
        }

        const tweets = await fetchAndProcessTweets(currentApiUrl);

        if (tweets.length === 0) {
          console.log('No more tweets available.');
          break;
        }

        totalFetched += tweets.length;
        pagesProcessed++;
        allTweets = allTweets.concat(tweets);
        currentCursor = (tweets.length > 0) ? tweets[tweets.length - 1].cursor : null;

        if (cutoffDate) {
          const tweetDate = new Date(tweets[0].createdAt);
          const cutoffDateTime = new Date(cutoffDate);

          if ((mode === 'newer' && tweetDate <= cutoffDateTime) ||
            (mode === 'older' && tweetDate >= cutoffDateTime)) {
            console.log(`Reached cutoff date (${cutoffDate}). Stopping.`);
            reachedCutoff = true;
            break;
          }
        }

        if (tweets.length < tweetsPerRequest) {
          console.log('Fewer tweets than requested, may be at end.');
          break;
        }

        if (!currentCursor) {
          console.log('No cursor returned, may be at end.');
          break;
        }

      } catch (apiError) {
        console.error('API Fetch Error:', apiError);
        return new Response(
          JSON.stringify({
            success: false,
            error: `API Fetch Error: ${apiError.message}`,
            totalFetched,
            totalStored: 0,
            nextCursor: cursor,
            pagesProcessed,
            message: `Error processing page ${pagesProcessed}`,
            cursorMode: mode,
            isAtEnd: true,
            reachedCutoff
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const normalizedTweets = allTweets.map((tweet: any) => ({
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

    const { data, error, count } = await supabase
      .from('historical_tweets')
      .upsert(
        normalizedTweets.map((tweet: any) => ({
          id: tweet.id,
          text: tweet.text,
          created_at: tweet.createdAt,
          author_username: tweet.author.userName,
          author_name: tweet.author.name,
          author_profile_picture: tweet.author.profilePicture,
          is_reply: tweet.isReply,
          is_quote: tweet.isQuote,
          in_reply_to_id: tweet.inReplyToId,
          quoted_tweet_text: tweet.quoted_tweet?.text,
          quoted_tweet_author: tweet.quoted_tweet?.author?.userName,
          entities: tweet.entities,
          extended_entities: tweet.extendedEntities
        })),
        { onConflict: 'id' }
      )
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Supabase error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Supabase error: ${error.message}`,
          totalFetched,
          totalStored: 0,
          nextCursor: cursor,
          pagesProcessed,
          message: `Error storing tweets: ${error.message}`,
          cursorMode: mode,
          isAtEnd: true,
          reachedCutoff
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (currentCursor) {
      const { error: cursorError } = await supabase
        .from('twitter_cursors')
        .upsert(
          { cursor_type: mode, cursor_value: currentCursor },
          { onConflict: 'cursor_type' }
        );

      if (cursorError) {
        console.error('Error storing cursor:', cursorError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalFetched,
        totalStored: count || 0,
        nextCursor: currentCursor,
        pagesProcessed,
        message: `Successfully processed ${pagesProcessed} pages, fetched ${totalFetched} tweets, stored ${count || 0} new/updated tweets`,
        cursorMode: mode,
        isAtEnd: totalFetched < tweetsPerRequest && pagesProcessed > 0,
        reachedCutoff
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unexpected error: ${error.message}`,
        totalFetched: 0,
        totalStored: 0,
        nextCursor: null,
        pagesProcessed: 0,
        message: `Unexpected error: ${error.message}`,
        cursorMode: 'older',
        isAtEnd: true,
        reachedCutoff: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
