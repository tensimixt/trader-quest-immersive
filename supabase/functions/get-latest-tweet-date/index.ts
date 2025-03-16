
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a single Supabase client for interacting with the database
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching the latest tweet date from historical_tweets table');
    
    // Query the database to get the most recent tweet date
    const { data, error } = await supabase
      .from('historical_tweets')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching latest tweet date:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data) {
      console.log('No tweets found in the database');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No tweets found in the database',
          latestDate: null
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    console.log(`Latest tweet date found: ${data.created_at}`);
    
    // Store the latest date in the twitter_cursors table
    const { error: storeError } = await supabase
      .from('twitter_cursors')
      .upsert(
        { cursor_type: 'latest_date', cursor_value: data.created_at },
        { onConflict: 'cursor_type' }
      );
    
    if (storeError) {
      console.error('Error storing latest date:', storeError);
      throw new Error(`Failed to store latest date: ${storeError.message}`);
    }
    
    // Return the result
    return new Response(
      JSON.stringify({
        success: true,
        latestDate: data.created_at
      }),
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
        latestDate: null
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
