import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { marketIntelligence } from '@/data/marketIntelligence';
import { HistoricalTweetBatch } from '@/types/tweetTypes';
import { formatUtcTime } from '@/utils/dateUtils';

// Define initial cutoff date constant (will be updated with latest tweet date)
export const INITIAL_CUTOFF_DATE = "2025-03-16 00:41:00+00";

export interface FetchHistoricalResult {
  success: boolean;
  isAtEnd: boolean;
  hasData: boolean;
}

export const useTweetFetching = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoricalLoading, setIsHistoricalLoading] = useState(false);
  const [isFetchingUntilCutoff, setIsFetchingUntilCutoff] = useState(false);
  const [isFetchingNew, setIsFetchingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tweetData, setTweetData] = useState<any[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [fetchingMode, setFetchingMode] = useState<'newer' | 'older'>('older');
  const [apiErrorCount, setApiErrorCount] = useState(0);
  const [lastFetchAttempt, setLastFetchAttempt] = useState<Date | null>(null);
  const [batchSize, setBatchSize] = useState(20);
  const [tweetsPerRequest, setTweetsPerRequest] = useState(20);
  const [isPossiblyAtEnd, setIsPossiblyAtEnd] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAutoClickEnabled, setIsAutoClickEnabled] = useState(true);
  const [isUntilCutoffDialogOpen, setIsUntilCutoffDialogOpen] = useState(false);
  const [cutoffDate, setCutoffDate] = useState(INITIAL_CUTOFF_DATE);
  const [isLatestDateLoading, setIsLatestDateLoading] = useState(false);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const autoClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initialTweets = marketIntelligence
      .filter(item => item.screenName)
      .map(item => ({
        id: item.id.toString(),
        text: item.message,
        createdAt: item.timestamp,
        author: {
          userName: item.screenName || "unknown",
          name: item.screenName || "Unknown User",
          profilePicture: "https://pbs.twimg.com/profile_images/1608560432897314823/ErsxYIuW_normal.jpg"
        },
        isReply: item.isReply || false,
        isQuote: item.isQuote || false,
        quoted_tweet: item.quoteTweet ? {
          text: item.quoteTweet,
          author: {
            userName: item.screenName,
            name: item.screenName || "Unknown User",
            profilePicture: "https://pbs.twimg.com/profile_images/1608560432897314823/ErsxYIuW_normal.jpg"
          }
        } : undefined,
        entities: { media: [] },
        extendedEntities: { media: [] }
      }));
    
    setTweetData(initialTweets);
    fetchTweets();
    
    checkStoredCursors();
    fetchLatestTweetDate();
  }, []);

  const fetchLatestTweetDate = async () => {
    setIsLatestDateLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('historical_tweets')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching latest tweet date:', error);
        toast.error('Could not fetch latest tweet date. Using default cutoff date.');
        return;
      }
      
      if (data && data.created_at) {
        const latestDate = new Date(data.created_at);
        const formattedDate = formatUtcTime(latestDate);
        
        setCutoffDate(formattedDate);
        toast.success(`Latest tweet date found: ${formattedDate}`);
      } else {
        toast.info('No tweets found in database. Using default cutoff date.');
      }
    } catch (error) {
      console.error('Error in fetchLatestTweetDate:', error);
      toast.error('Error fetching latest tweet date. Using default cutoff date.');
    } finally {
      setIsLatestDateLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchTweets();
      }
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const setupAutoClick = () => {
    if (isAutoClickEnabled && !isPossiblyAtEnd && !isHistoricalLoading && fetchingMode === 'older') {
      if (autoClickTimeoutRef.current) {
        clearTimeout(autoClickTimeoutRef.current);
      }
      
      autoClickTimeoutRef.current = setTimeout(() => {
        if (continueButtonRef.current && !isHistoricalLoading && !isPossiblyAtEnd) {
          toast.info("Auto-clicking Continue Older...");
          continueButtonRef.current.click();
        }
      }, 5000);
    }
  };

  const checkStoredCursors = async () => {
    try {
      const { data: newerCursor, error: newerError } = await supabase
        .from('twitter_cursors')
        .select('cursor_value')
        .eq('cursor_type', 'newer')
        .single();
      
      const { data: olderCursor, error: olderError } = await supabase
        .from('twitter_cursors')
        .select('cursor_value')
        .eq('cursor_type', 'older')
        .single();
      
      if (!olderError && olderCursor) {
        toast.info('Found stored position for older tweets. Click "Continue Older" to resume.');
      }
      
      if (!newerError && newerCursor) {
        toast.info('Found stored position for newer tweets. Click "Continue Newer" to resume.');
      }
      
      if (fetchingMode === 'newer' && !newerError && newerCursor) {
        setCurrentCursor(newerCursor.cursor_value);
      } else if (fetchingMode === 'older' && !olderError && olderCursor) {
        setCurrentCursor(olderCursor.cursor_value);
      }
    } catch (error) {
      console.error('Error checking stored cursors:', error);
    }
  };

  const fetchTweets = async () => {
    if (lastFetchAttempt && (new Date().getTime() - lastFetchAttempt.getTime() < 3000)) {
      toast.warning('Please wait a moment before refreshing again');
      return;
    }
    
    setLastFetchAttempt(new Date());
    setIsLoading(true);
    try {
      if (searchTerm) {
        setIsSearching(true);
        const { data, error } = await supabase.functions.invoke('get-historical-tweets', {
          body: { 
            page: 1, 
            pageSize: 1000, 
            search: searchTerm 
          }
        });
        
        if (error) {
          throw new Error(`Function error: ${error.message}`);
        }
        
        console.log('Supabase function response (search):', data);
        
        if (data && data.tweets && Array.isArray(data.tweets)) {
          setTweetData(data.tweets);
          toast.success(`Found ${data.tweets.length} tweets matching "${searchTerm}"`);
        } else {
          toast.info(`No tweets found matching "${searchTerm}"`);
          setTweetData([]);
        }
      } else {
        setIsSearching(false);
        const { data, error } = await supabase.functions.invoke('twitter-feed');
        
        if (error) {
          throw new Error(`Function error: ${error.message}`);
        }
        
        console.log('Supabase function response:', data);
        
        if (data && data.tweets && Array.isArray(data.tweets)) {
          const formattedTweets = data.tweets.map((tweet: any) => ({
            id: tweet.id,
            text: tweet.text,
            createdAt: tweet.createdAt,
            author: {
              userName: tweet.author?.userName || "unknown",
              name: tweet.author?.name || "Unknown User",
              profilePicture: tweet.author?.profilePicture || "https://pbs.twimg.com/profile_images/1608560432897314823/ErsxYIuW_normal.jpg"
            },
            isReply: tweet.isReply || false,
            isQuote: tweet.isQuote || false,
            quoted_tweet: tweet.quoted_tweet ? {
              text: tweet.quoted_tweet.text,
              author: {
                userName: tweet.quoted_tweet.author?.userName || "unknown",
                name: tweet.quoted_tweet.author?.name || "Unknown User",
                profilePicture: tweet.quoted_tweet.author?.profilePicture || "https://pbs.twimg.com/profile_images/1608560432897314823/ErsxYIuW_normal.jpg"
              },
              entities: tweet.quoted_tweet.entities || { media: [] },
              extendedEntities: tweet.quoted_tweet.extendedEntities || { media: [] }
            } : undefined,
            entities: tweet.entities || { media: [] },
            extendedEntities: tweet.extendedEntities || { media: [] }
          }));
          
          setTweetData(formattedTweets);
          toast.success('Tweets loaded successfully');
        } else {
          throw new Error('Invalid response format from function');
        }
      }
      
      setApiErrorCount(0);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      toast.error('Failed to load tweets from API, using sample data');
      setApiErrorCount(prev => prev + 1);
      
      if (apiErrorCount > 2) {
        toast.error('Multiple API errors detected. The Twitter API may be experiencing issues.');
      }
      
      if (!searchTerm) {
        const sampleTweets = marketIntelligence
          .filter(item => item.screenName)
          .map(item => ({
            id: item.id.toString(),
            text: item.message,
            createdAt: item.timestamp,
            author: {
              userName: item.screenName || "unknown",
              name: item.screenName || "Unknown User",
              profilePicture: "https://pbs.twimg.com/profile_images/1608560432897314823/ErsxYIuW_normal.jpg"
            },
            isReply: item.isReply || false,
            isQuote: item.isQuote || false,
            quoted_tweet: item.quoteTweet ? {
              text: item.quoteTweet,
              author: {
                userName: item.screenName,
                name: item.screenName || "Unknown User",
                profilePicture: "https://pbs.twimg.com/profile_images/1608560432897314823/ErsxYIuW_normal.jpg"
              }
            } : undefined,
            entities: { media: [] },
            extendedEntities: { media: [] }
          }));
        
        setTweetData(sampleTweets);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoricalTweets = async (startNew = false): Promise<FetchHistoricalResult> => {
    if (lastFetchAttempt && (new Date().getTime() - lastFetchAttempt.getTime() < 3000)) {
      toast.warning('Please wait a moment before fetching again');
      return {
        success: false,
        isAtEnd: false,
        hasData: false
      };
    }
    
    setLastFetchAttempt(new Date());
    setIsHistoricalLoading(true);
    setIsPossiblyAtEnd(false);
    
    try {
      toast.info(`Starting ${fetchingMode} tweet fetch (batch size: ${batchSize})...`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await supabase.functions.invoke<HistoricalTweetBatch>('twitter-historical', {
        body: { 
          cursor: startNew ? null : currentCursor,
          batchSize: batchSize,
          startNew: startNew,
          mode: fetchingMode,
          tweetsPerRequest: tweetsPerRequest
        }
      });
      
      if (result.error) {
        throw new Error(`Function error: ${result.error.message}`);
      }
      
      const data = result.data;
      console.log('Historical tweets response:', data);
      
      if (data?.success) {
        setCurrentCursor(data.nextCursor);
        
        if (data.totalFetched > 0) {
          toast.success(`Fetched ${data.totalFetched} historical tweets (stored ${data.totalStored} new/updated tweets) from ${data.pagesProcessed} pages`);
        } else {
          toast.info('No new tweets found in this batch.');
          setIsPossiblyAtEnd(true);
        }
        
        if (data.isAtEnd) {
          setIsPossiblyAtEnd(true);
          toast.info(
            `Only ${data.totalFetched} tweets retrieved despite ${data.pagesProcessed} requests. You may have reached the end of available data.`
          );
        }
        
        if (data.nextCursor && !data.isAtEnd) {
          toast.info(`More historical tweets may be available. Click "Continue ${fetchingMode === 'newer' ? 'Newer' : 'Older'}" to try getting more.`);
        } else if (!data.nextCursor || data.isAtEnd) {
          toast.info(`You may have reached the end of ${fetchingMode === 'newer' ? 'recent' : 'historical'} tweets.`);
          setIsPossiblyAtEnd(true);
        }
        
        setApiErrorCount(0);
        
        await fetchTweets();
        
        setupAutoClick();
        
        return {
          success: true,
          isAtEnd: data.isAtEnd || !data.nextCursor,
          hasData: data.totalFetched > 0
        };
      } else {
        throw new Error(data?.error || 'Failed to fetch historical tweets');
      }
    } catch (error) {
      console.error('Error fetching historical tweets:', error);
      toast.error('Failed to fetch historical tweets');
      setApiErrorCount(prev => prev + 1);
      
      if (apiErrorCount > 2) {
        toast.error('Multiple API errors detected. The Twitter API may be experiencing issues.');
      }
      
      return {
        success: false,
        isAtEnd: false,
        hasData: false
      };
    } finally {
      setIsHistoricalLoading(false);
    }
  };

  const fetchTweetsUntilCutoff = async () => {
    setIsFetchingUntilCutoff(true);
    setIsUntilCutoffDialogOpen(false);
    
    try {
      toast.info(`Starting fetch until cutoff date: ${cutoffDate}`);
      
      const originalMode = fetchingMode;
      setFetchingMode('newer');
      
      let currentBatch = 1;
      let keepFetching = true;
      let cursor = null;
      let totalTweets = 0;
      
      while (keepFetching) {
        toast.info(`Fetching batch ${currentBatch}...`);
        
        const result = await supabase.functions.invoke<HistoricalTweetBatch>('twitter-historical', {
          body: { 
            cursor: cursor,
            batchSize: batchSize,
            startNew: cursor === null,
            mode: 'newer',
            tweetsPerRequest: tweetsPerRequest,
            cutoffDate: cutoffDate
          }
        });
        
        if (result.error) {
          throw new Error(`Function error: ${result.error.message}`);
        }
        
        const data = result.data;
        console.log(`Batch ${currentBatch} response:`, data);
        
        if (!data?.success) {
          throw new Error(data?.error || `Failed to fetch batch ${currentBatch}`);
        }
        
        cursor = data.nextCursor;
        
        totalTweets += data.totalFetched || 0;
        
        if (data.reachedCutoff || data.isAtEnd || !data.nextCursor || data.totalFetched === 0) {
          keepFetching = false;
          
          if (data.reachedCutoff) {
            toast.success(`Reached cutoff date (${cutoffDate})! Operation complete.`);
          } else if (data.isAtEnd) {
            toast.info(`Reached the end of available tweets.`);
          } else if (!data.nextCursor) {
            toast.info(`No pagination cursor returned. Cannot fetch more tweets.`);
          } else {
            toast.info(`No new tweets found in the latest batch.`);
          }
        }
        
        currentBatch++;
        
        if (currentBatch > 50) {
          toast.warning(`Reached maximum batch limit (50). Stopping operation.`);
          keepFetching = false;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setFetchingMode(originalMode);
      
      toast.success(`Operation complete! Fetched ${totalTweets} tweets across ${currentBatch - 1} batches.`);
      
      await fetchTweets();
      
      fetchLatestTweetDate();
    } catch (error) {
      console.error('Error in fetchTweetsUntilCutoff:', error);
      toast.error(`Failed to complete operation: ${error.message}`);
    } finally {
      setIsFetchingUntilCutoff(false);
    }
  };

  const fetchNewTweets = async () => {
    setIsFetchingNew(true);
    
    try {
      toast.info(`Starting fetch for newest tweets (one request only)`);
      
      const originalMode = fetchingMode;
      setFetchingMode('newer');
      
      const result = await supabase.functions.invoke<HistoricalTweetBatch>('twitter-historical', {
        body: { 
          cursor: null,
          batchSize: 1,
          startNew: true,
          mode: 'newer',
          tweetsPerRequest: tweetsPerRequest
        }
      });
      
      if (result.error) {
        throw new Error(`Function error: ${result.error.message}`);
      }
      
      const data = result.data;
      console.log(`Single fetch response:`, data);
      
      if (!data?.success) {
        throw new Error(data?.error || `Failed to fetch new tweets`);
      }
      
      const totalTweets = data.totalFetched || 0;
      
      setFetchingMode(originalMode);
      
      toast.success(`Fetch complete! Retrieved ${totalTweets} tweets with a single request.`);
      
      await fetchTweets();
      
    } catch (error) {
      console.error('Error in fetchNewTweets:', error);
      toast.error(`Failed to fetch new tweets: ${error.message}`);
    } finally {
      setIsFetchingNew(false);
    }
  };

  const retryWithBackoff = async <T,>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        retries++;
        if (retries >= maxRetries) throw error;
        console.log(`Retry ${retries}/${maxRetries} after error:`, error);
        toast.info(`Retry attempt ${retries}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  };

  const toggleFetchingMode = () => {
    const newMode = fetchingMode === 'newer' ? 'older' : 'newer';
    setFetchingMode(newMode);
    
    checkStoredCursors();
    
    toast.info(`Switched to fetching ${newMode} tweets`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTweets();
  };

  const handleRetryFetch = () => {
    retryWithBackoff(fetchTweets)
      .then(() => toast.success('Refresh successful!'))
      .catch(err => toast.error(`Refresh failed after multiple attempts: ${err.message}`));
  };

  const handleRetryHistorical = async () => {
    try {
      await retryWithBackoff(async () => {
        const result = await fetchHistoricalTweets(false);
        if (result.success) {
          toast.success('Historical fetch successful!');
        }
        return result;
      });
    } catch (err) {
      toast.error(`Historical fetch failed after multiple attempts: ${err.message}`);
    }
  };
  
  const handleStartNewHistorical = async () => {
    try {
      await retryWithBackoff(async () => {
        const result = await fetchHistoricalTweets(true);
        if (result.success) {
          toast.success('Started new fetch sequence!');
        }
        return result;
      });
    } catch (err) {
      toast.error(`Failed to start new fetch: ${err.message}`);
    }
  };

  return {
    tweetData,
    isLoading,
    isHistoricalLoading,
    isFetchingUntilCutoff,
    isFetchingNew,
    searchTerm,
    setSearchTerm,
    fetchingMode,
    isPossiblyAtEnd,
    isSearching,
    batchSize,
    setBatchSize,
    tweetsPerRequest,
    setTweetsPerRequest,
    isAutoClickEnabled,
    setIsAutoClickEnabled,
    isUntilCutoffDialogOpen,
    setIsUntilCutoffDialogOpen,
    cutoffDate,
    isLatestDateLoading,
    continueButtonRef,
    toggleFetchingMode,
    handleSearchSubmit,
    handleRetryFetch,
    handleRetryHistorical,
    handleStartNewHistorical,
    fetchTweetsUntilCutoff,
    fetchNewTweets,
    fetchLatestTweetDate
  };
};
