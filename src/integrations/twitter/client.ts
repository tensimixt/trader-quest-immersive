
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

// Function to fetch the latest tweets and get their cursor
export const fetchLatestCursor = async () => {
  try {
    const EDGE_FUNCTION_URL = `${window.location.origin}/api/twitter-api?mode=get-cursor`;
    
    const response = await fetch(EDGE_FUNCTION_URL);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching latest cursor:', error);
    throw error;
  }
};

// Function to fetch and store tweets using cursor pagination until caught up
export const fetchAndStoreNewerTweets = async () => {
  try {
    // First, get the latest cursor from a fresh tweet fetch
    const latestCursorResult = await fetchLatestCursor();
    if (!latestCursorResult.success || !latestCursorResult.latest_cursor) {
      throw new Error('Failed to get latest cursor');
    }
    
    const targetCursor = latestCursorResult.latest_cursor;
    let currentCursor = latestCursorResult.stored_cursor || null;
    let isComplete = false;
    let totalTweetsStored = 0;
    let batchesProcessed = 0;
    const MAX_BATCHES = 10; // Safety limit to prevent infinite loops
    
    // Loop until we've caught up or hit the maximum batch limit
    while (!isComplete && batchesProcessed < MAX_BATCHES) {
      batchesProcessed++;
      
      // Fetch the next batch of tweets
      const EDGE_FUNCTION_URL = `${window.location.origin}/api/twitter-api?mode=fetch-and-store&targetCursor=${encodeURIComponent(targetCursor)}`;
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentCursor })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update stats
      totalTweetsStored += result.tweetsStored || 0;
      
      // Update cursor for next iteration
      currentCursor = result.nextCursor;
      
      // Check if we've reached the target or have no more tweets
      if (result.reachedTarget || result.tweetsProcessed === 0 || !result.nextCursor) {
        isComplete = true;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return {
      success: true,
      tweetsStored: totalTweetsStored,
      batchesProcessed,
      isComplete,
      message: `Processed ${batchesProcessed} batches and stored ${totalTweetsStored} tweets`
    };
  } catch (error) {
    console.error('Error fetching and storing newer tweets:', error);
    return {
      success: false,
      error: error.message
    };
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
