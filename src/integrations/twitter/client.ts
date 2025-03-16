
// Twitter API client for the application

// Default Twitter API key - stored here for demonstration purposes only
// In a production environment, this should be stored in environment variables
const TWITTER_API_KEY = 'cbd4102b6e7a4a5a95f9db1fd92c90e4';

// Function to fetch tweets from Twitter API
export const fetchTweets = async () => {
  try {
    // First, try to use the Supabase edge function
    const EDGE_FUNCTION_URL = `${window.location.origin}/api/twitter-api`;
    
    try {
      const response = await fetch(EDGE_FUNCTION_URL);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Edge function failed, falling back to direct API call:', err);
    }
    
    // Fallback to direct API call
    const response = await fetch('https://api.twitterapi.io/twitter/list/tweets', {
      method: 'GET',
      headers: {
        'X-API-Key': TWITTER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
};

// Function to fetch tweets with a cursor
export const fetchTweetsWithCursor = async (cursor: string) => {
  try {
    // Use the Supabase edge function with cursor parameter
    const EDGE_FUNCTION_URL = `${window.location.origin}/api/twitter-api?cursor=${encodeURIComponent(cursor)}`;
    
    const response = await fetch(EDGE_FUNCTION_URL);
    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching tweets with cursor:', error);
    throw error;
  }
};

// Function to fetch tweets until a specific cutoff date
export const fetchTweetsUntilDate = async (cursor: string | null, cutoffDate: string) => {
  try {
    // Use the Supabase edge function with cursor and cutoffDate parameters
    let url = `${window.location.origin}/api/twitter-api?mode=until`;
    
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    
    url += `&cutoffDate=${encodeURIComponent(cutoffDate)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching tweets until date:', error);
    throw error;
  }
};

// Basic tweet classification using heuristics
export const classifyTweet = (tweet: any) => {
  // Extract relevant info from tweet
  const text = tweet.text || '';
  const username = tweet.author?.userName || '';
  const isReply = tweet.isReply || false;
  const isQuote = tweet.isQuote || tweet.quoted_tweet || false;
  
  // Simple classification logic
  let market = 'UNKNOWN';
  let direction = 'NEUTRAL';
  let confidence = 50;
  
  // Market detection
  if (text.toLowerCase().includes('btc') || text.toLowerCase().includes('bitcoin')) {
    market = 'BTC';
  } else if (text.toLowerCase().includes('eth') || text.toLowerCase().includes('ethereum')) {
    market = 'ETH';
  }
  
  // Direction detection
  if (text.toLowerCase().includes('bull') || text.toLowerCase().includes('buy') || 
      text.toLowerCase().includes('moon') || text.toLowerCase().includes('long')) {
    direction = 'UP';
    confidence += 20;
  } else if (text.toLowerCase().includes('bear') || text.toLowerCase().includes('sell') || 
             text.toLowerCase().includes('short') || text.toLowerCase().includes('dump')) {
    direction = 'DOWN';
    confidence += 20;
  }
  
  // Refine confidence based on user
  if (['MuroCrypto', 'Pentosh1', 'I_Am_The_ICT'].includes(username)) {
    confidence += 15;
  }
  
  // Cap confidence
  confidence = Math.min(confidence, 95);
  
  return {
    market,
    direction,
    confidence,
    tweet
  };
};
