
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Getting latest tweet timestamp from historical_tweets table');
    
    // Query the latest created_at timestamp from historical_tweets
    const { data, error } = await supabase
      .from('historical_tweets')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching latest tweet date:', error);
      throw new Error('Failed to fetch latest tweet date');
    }
    
    // Format the date nicely for display
    const latestDate = data?.created_at || null;
    console.log('Latest tweet date:', latestDate);
    
    return new Response(
      JSON.stringify({
        latest_date: latestDate,
        formatted_date: latestDate ? new Date(latestDate).toLocaleString() : null,
        success: true
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in get-latest-tweet-date function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        latest_date: null,
        formatted_date: null
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
