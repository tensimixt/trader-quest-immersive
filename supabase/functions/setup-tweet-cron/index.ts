
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { setupCronJob } from "../_shared/setup-cron.ts";

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
    console.log('Setting up tweet fetch cron job');
    
    const result = await setupCronJob();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error setting up cron job');
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Tweet fetch cron job has been set up to run every minute',
      details: result.details
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in setup-tweet-cron function:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: "Error setting up tweet fetch cron job"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
