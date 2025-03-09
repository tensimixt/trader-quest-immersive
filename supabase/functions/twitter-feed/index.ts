
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY') || '63b174ff7c2f44af89a86e7022509709';
// Twitter crypto list ID - using the correct list ID provided by the user
const TWITTER_LIST_ID = '1674940005557387266';
const MAX_RETRIES = 3; // Maximum number of retries for API requests
const RETRY_DELAY = 1000; // Delay between retries in milliseconds

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok && retries > 0) {
      console.log(`Request failed with status ${response.status}, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Request failed with error: ${error.message}, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Twitter feed function called');
    
    // Include the list ID in the URL to fetch tweets from the specific list
    const url = `https://api.twitterapi.io/twitter/list/tweets?listId=${TWITTER_LIST_ID}`;
    console.log('Calling Twitter API with URL:', url);
    
    let response;
    try {
      response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'X-API-Key': TWITTER_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Twitter API error:', errorText, 'Status:', response.status);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error(`Failed to fetch tweets after retries: ${error.message}`);
      throw error;
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
    
    // Log whether the response contains media and quote tweets (for debugging)
    const hasMedia = data.tweets?.some(tweet => 
      tweet.extendedEntities?.media?.length > 0 || 
      tweet.entities?.media?.length > 0
    );
    const hasQuoteTweets = data.tweets?.some(tweet => tweet.quoted_tweet);
    
    console.log(`Response contains media: ${hasMedia}, quote tweets: ${hasQuoteTweets}`);
    
    // Ensure each tweet has entities and extendedEntities objects to avoid undefined errors
    if (data.tweets && Array.isArray(data.tweets)) {
      data.tweets = data.tweets.map(tweet => {
        const processedTweet = {
          ...tweet,
          entities: tweet.entities || {},
          extendedEntities: tweet.extendedEntities || {},
          // Process isQuote flag based on whether a quoted_tweet exists
          isQuote: !!tweet.quoted_tweet,
        };
        
        // If there's a quoted tweet, ensure it also has the necessary structure
        if (tweet.quoted_tweet) {
          processedTweet.quoted_tweet = {
            ...tweet.quoted_tweet,
            text: tweet.quoted_tweet.text || '',
            author: tweet.quoted_tweet.author || { 
              userName: 'unknown',
              name: 'Unknown User',
              profilePicture: ''
            },
            // Ensure quoted tweets also have entities and extendedEntities
            entities: tweet.quoted_tweet.entities || {},
            extendedEntities: tweet.quoted_tweet.extendedEntities || {}
          };
        }
        
        return processedTweet;
      });
    }

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
        details: error.message,
        success: false,
        tweets: [] // Return an empty array so the client has something to work with
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
