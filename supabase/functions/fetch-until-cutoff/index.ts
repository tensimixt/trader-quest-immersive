
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";
import { isOlderThan, formatDatabaseTimestamp } from '../_shared/dateUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get environment variables
const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || 'cbd4102b6e7a4a5a95f9db1fd92c90e4';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetch until cutoff function called');
    
    if (!TWITTER_API_KEY) {
      throw new Error('TWITTER_API_KEY is not configured');
    }
    
    const { cursor, batchSize = 20, cutoffDate } = await req.json();
    
    console.log(`Starting fetch until cutoff with parameters:`, { cursor, batchSize, cutoffDate });
    
    // Create Supabase client for database operations
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // If no cutoff date is provided, try to get the latest tweet date from twitter_cursors
    let effectiveCutoffDate = cutoffDate;
    if (!effectiveCutoffDate) {
      const { data: cursorData, error: cursorError } = await supabase
        .from('twitter_cursors')
        .select('cursor_value')
        .eq('cursor_type', 'latest_date')
        .single();
      
      if (cursorError) {
        console.warn('Could not get latest date from cursors:', cursorError);
      } else if (cursorData?.cursor_value) {
        effectiveCutoffDate = cursorData.cursor_value;
        console.log(`Using latest date from cursors: ${effectiveCutoffDate}`);
      } else {
        console.warn('No latest date found in cursors table');
      }
    }
    
    if (!effectiveCutoffDate) {
      throw new Error('No cutoff date provided and none found in database');
    }
    
    console.log(`Using cutoff date: ${effectiveCutoffDate}`);
    
    // Set up variables for the fetch operation
    let currentCursor = cursor;
    let reachedCutoff = false;
    let isAtEnd = false;
    let totalFetched = 0;
    let totalStored = 0;
    let pagesProcessed = 0;
    
    // Make a single request to the Twitter API
    console.log(`Making request to Twitter API with cursor: ${currentCursor || 'null'}`);
    
    const apiUrl = "https://api.twitterapi.io/twitter/list/tweets";
    const apiHeaders = {
      "X-API-Key": TWITTER_API_KEY,
      "Content-Type": "application/json",
    };
    
    const apiParams = {
      cursor: currentCursor || undefined,
      count: 20, // API seems to default to around 20 tweets per request
      usernames: "poordart,SmokeyHosoda,devchart,inversebrah,I_Am_The_ICT,MuroCrypto,DonAlt,CryptoAdamNFT,BalloonSkies,AlgodTrading,PremiumAnalyst,jtemin,Trader1sz,MiladyMorgana,loomdart,Naiiveclub,cmsholdings,BuckyBTC,yieldyak_,DailyMRI", 
      excludeLinks: false,
    };
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: apiHeaders,
      params: apiParams,
    });
    
    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Twitter API response received with ${data.tweets?.length || 0} tweets`);
    
    pagesProcessed++;
    
    if (data.tweets && Array.isArray(data.tweets)) {
      totalFetched += data.tweets.length;
      
      // Process tweets
      const batchTweets = [];
      
      for (const tweet of data.tweets) {
        const tweetDate = new Date(tweet.createdAt).toISOString();
        
        // Skip tweets that are older than the cutoff date
        if (effectiveCutoffDate && isOlderThan(tweetDate, effectiveCutoffDate)) {
          reachedCutoff = true;
          console.log(`Reached cutoff date (${effectiveCutoffDate}) with tweet date ${tweetDate}`);
          break;
        }
        
        // Format the tweet for database storage
        const formattedTweet = {
          id: tweet.id,
          text: tweet.text,
          created_at: tweetDate,
          author_username: tweet.author?.userName || "",
          author_name: tweet.author?.name || "",
          author_profile_picture: tweet.author?.profilePicture || "",
          is_reply: tweet.isReply || false,
          is_quote: tweet.isQuote || false,
          in_reply_to_id: tweet.inReplyToId || null,
          quoted_tweet_text: tweet.quoted_tweet?.text || null,
          quoted_tweet_author: tweet.quoted_tweet?.author?.userName || null,
          entities: tweet.entities || null,
          extended_entities: tweet.extendedEntities || null,
        };
        
        batchTweets.push(formattedTweet);
      }
      
      // Store tweets in the database
      if (batchTweets.length > 0) {
        console.log(`Storing ${batchTweets.length} tweets in the database`);
        
        const { data: insertData, error: insertError } = await supabase
          .from('historical_tweets')
          .upsert(batchTweets, { onConflict: 'id' });
        
        if (insertError) {
          console.error('Error storing tweets:', insertError);
        } else {
          totalStored += batchTweets.length;
          console.log(`Successfully stored ${batchTweets.length} tweets`);
        }
      }
      
      // Update cursor
      if (data.next && !reachedCutoff) {
        currentCursor = data.next;
        
        // Store the cursor for later use
        const { error: cursorError } = await supabase
          .from('twitter_cursors')
          .upsert(
            { cursor_type: 'newer', cursor_value: currentCursor },
            { onConflict: 'cursor_type' }
          );
        
        if (cursorError) {
          console.error('Error storing cursor:', cursorError);
        }
      } else {
        isAtEnd = true;
      }
    } else {
      console.log('No tweets in response or invalid response format');
      isAtEnd = true;
    }
    
    return new Response(JSON.stringify({
      success: true,
      nextCursor: currentCursor,
      totalFetched,
      totalStored,
      pagesProcessed,
      isAtEnd,
      reachedCutoff,
      cutoffDate: effectiveCutoffDate
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in fetch until cutoff function:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      totalFetched: 0,
      totalStored: 0,
      pagesProcessed: 0,
      isAtEnd: false,
      reachedCutoff: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
