
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || '63b174ff7c2f44af89a86e7022509709';
// Twitter crypto list ID - this is a public crypto-focused Twitter list
const TWITTER_LIST_ID = '1650549894331887617';

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
    console.log('Twitter feed function called');
    
    const url = `https://api.twitterapi.io/twitter/list/tweets?listId=${TWITTER_LIST_ID}`;
    console.log('Calling Twitter API with URL:', url);
    
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
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    
    // Check if the response is JSON
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Non-JSON response from Twitter API:', responseText);
      throw new Error('API returned non-JSON response');
    }
    
    const data = await response.json();
    console.log('Twitter API response received successfully');
    
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in Twitter feed function:', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch tweets', 
        details: error.message 
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
