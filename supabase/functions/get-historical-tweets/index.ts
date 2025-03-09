
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://zzbftruhrjfmynhamypk.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Get historical tweets function called');
    
    const { page = 1, pageSize = 20, market, direction, search } = await req.json();
    
    console.log('Search parameters:', { page, pageSize, market, direction, search });
    
    // Create Supabase client for database operations
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Build the query
    let query = supabase
      .from('historical_tweets')
      .select('*, classification')
      .order('created_at', { ascending: false });
    
    // Add filtering if provided
    if (market && market !== 'all') {
      query = query.filter('classification->market', 'eq', market);
    }
    
    if (direction && direction !== 'all') {
      query = query.filter('classification->direction', 'eq', direction);
    }
    
    if (search) {
      // Use a more comprehensive search across multiple fields
      query = query.or(`text.ilike.%${search}%,quoted_tweet_text.ilike.%${search}%,author_username.ilike.%${search}%,author_name.ilike.%${search}%`);
    }
    
    // Count total matching records first (for pagination)
    const { count: totalCount, error: countError } = await supabase
      .from('historical_tweets')
      .select('*', { count: 'exact', head: true })
      .or(`text.ilike.%${search || ''}%,quoted_tweet_text.ilike.%${search || ''}%,author_username.ilike.%${search || ''}%,author_name.ilike.%${search || ''}%`);
      
    if (countError) {
      console.error('Error counting records:', countError);
    }
    
    console.log(`Found ${totalCount} total matching records`);
    
    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    // Execute the query
    const { data: tweets, error, count } = await query;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`Retrieved ${tweets?.length || 0} tweets for page ${page}`);
    
    // Format the tweets to match the expected format in the UI
    const formattedTweets = tweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at,
      author: {
        userName: tweet.author_username,
        name: tweet.author_name || tweet.author_username,
        profilePicture: tweet.author_profile_picture || "https://pbs.twimg.com/profile_images/1608560432897314823/ErsxYIuW_normal.jpg"
      },
      isReply: tweet.is_reply,
      isQuote: tweet.is_quote,
      inReplyToId: tweet.in_reply_to_id,
      quoted_tweet: tweet.quoted_tweet_text ? {
        text: tweet.quoted_tweet_text,
        author: tweet.quoted_tweet_author ? {
          userName: tweet.quoted_tweet_author,
          name: tweet.quoted_tweet_author,
          profilePicture: "https://pbs.twimg.com/profile_images/1608560432897314823/ErsxYIuW_normal.jpg"
        } : undefined
      } : undefined,
      entities: tweet.entities,
      extendedEntities: tweet.extended_entities,
      classification: tweet.classification
    }));

    return new Response(JSON.stringify({
      tweets: formattedTweets,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get historical tweets function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "Error retrieving historical tweets"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
