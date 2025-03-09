
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, RefreshCcw, ArrowLeft, History, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from '@/hooks/use-mobile';
import { AppHeader } from '@/components/AppHeader';
import TweetClassifier from '@/components/TweetClassifier';
import { marketIntelligence } from '@/data/marketIntelligence';
import { supabase } from '@/integrations/supabase/client';
import { HistoricalTweetBatch } from '@/types/tweetTypes';

const TweetAnalyzer = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoricalLoading, setIsHistoricalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tweetData, setTweetData] = useState<any[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [fetchingMode, setFetchingMode] = useState<'newer' | 'older'>('older');
  const [apiErrorCount, setApiErrorCount] = useState(0);
  const [lastFetchAttempt, setLastFetchAttempt] = useState<Date | null>(null);
  
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
    
    // Check for stored cursors on initial load
    checkStoredCursors();
  }, []);

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
      
      // Set the current cursor based on the current mode
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
    // Check if we attempted a fetch very recently to prevent spamming
    if (lastFetchAttempt && (new Date().getTime() - lastFetchAttempt.getTime() < 3000)) {
      toast.warning('Please wait a moment before refreshing again');
      return;
    }
    
    setLastFetchAttempt(new Date());
    setIsLoading(true);
    try {
      // Add a small delay to avoid potential rate limiting or gateway timeouts
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        // Reset error count on success
        setApiErrorCount(0);
      } else {
        throw new Error('Invalid response format from function');
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
      toast.error('Failed to load tweets from API, using sample data');
      setApiErrorCount(prev => prev + 1);
      
      if (apiErrorCount > 2) {
        toast.error('Multiple API errors detected. The Twitter API may be experiencing issues.', {
          duration: 5000,
          icon: <AlertTriangle className="text-red-500" />
        });
      }
      
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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoricalTweets = async (startNew = false) => {
    // Check if we attempted a fetch very recently to prevent spamming
    if (lastFetchAttempt && (new Date().getTime() - lastFetchAttempt.getTime() < 3000)) {
      toast.warning('Please wait a moment before fetching again');
      return;
    }
    
    setLastFetchAttempt(new Date());
    setIsHistoricalLoading(true);
    try {
      toast.info(`Starting ${fetchingMode} tweet fetch...`);
      
      // Add a small delay to avoid potential rate limiting or gateway timeouts
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await supabase.functions.invoke<HistoricalTweetBatch>('twitter-historical', {
        body: { 
          cursor: startNew ? null : currentCursor,
          batchSize: 5,
          startNew: startNew,
          mode: fetchingMode
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
        }
        
        if (data.nextCursor) {
          toast.info(`More historical tweets available. Click "Continue ${fetchingMode === 'newer' ? 'Newer' : 'Older'}" to get more.`);
        } else {
          toast.info(`All ${fetchingMode === 'newer' ? 'recent' : 'historical'} tweets have been fetched.`);
        }
        // Reset error count on success
        setApiErrorCount(0);
        
        // Refresh the tweet list to show any new tweets
        fetchTweets();
      } else {
        throw new Error(data?.error || 'Failed to fetch historical tweets');
      }
    } catch (error) {
      console.error('Error fetching historical tweets:', error);
      toast.error('Failed to fetch historical tweets');
      setApiErrorCount(prev => prev + 1);
      
      if (apiErrorCount > 2) {
        toast.error('Multiple API errors detected. The Twitter API may be experiencing issues.', {
          duration: 5000,
          icon: <AlertTriangle className="text-red-500" />
        });
      }
    } finally {
      setIsHistoricalLoading(false);
    }
  };

  const retryWithBackoff = async (fn: () => Promise<void>, maxRetries = 3) => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        retries++;
        if (retries >= maxRetries) throw error;
        console.log(`Retry ${retries}/${maxRetries} after error:`, error);
        toast.info(`Retry attempt ${retries}/${maxRetries}...`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  };

  const toggleFetchingMode = () => {
    const newMode = fetchingMode === 'newer' ? 'older' : 'newer';
    setFetchingMode(newMode);
    
    // When toggling mode, check if we have a stored cursor for the new mode
    checkStoredCursors();
    
    toast.info(`Switched to fetching ${newMode} tweets`);
  };

  const filteredTweets = tweetData.filter(tweet => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    if (tweet.text) {
      return (
        tweet.text.toLowerCase().includes(searchLower) ||
        (tweet.author?.userName || '').toLowerCase().includes(searchLower) ||
        (tweet.quoted_tweet?.text || '').toLowerCase().includes(searchLower)
      );
    }
    
    return (
      (tweet.message || '').toLowerCase().includes(searchLower) ||
      (tweet.screenName || '').toLowerCase().includes(searchLower) ||
      (tweet.quoteTweet || '').toLowerCase().includes(searchLower)
    );
  });

  const handleRetryFetch = () => {
    retryWithBackoff(fetchTweets)
      .then(() => toast.success('Refresh successful!'))
      .catch(err => toast.error(`Refresh failed after multiple attempts: ${err.message}`));
  };

  const handleRetryHistorical = () => {
    retryWithBackoff(() => fetchHistoricalTweets(false)) // Always continue from where we left off
      .then(() => toast.success('Historical fetch successful!'))
      .catch(err => toast.error(`Historical fetch failed after multiple attempts: ${err.message}`));
  };
  
  const handleStartNewHistorical = () => {
    retryWithBackoff(() => fetchHistoricalTweets(true)) // Start from newest tweets
      .then(() => toast.success('Started new fetch sequence!'))
      .catch(err => toast.error(`Failed to start new fetch: ${err.message}`));
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 flex flex-col min-h-screen"
      >
        <AppHeader />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-white">Tweet Analyzer</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search tweets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-black/40 border-emerald-500/30 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFetchingMode}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                {fetchingMode === 'older' ? "Switch to Newer" : "Switch to Older"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartNewHistorical}
                disabled={isHistoricalLoading}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <History className="h-4 w-4 mr-2" />
                Start New
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryHistorical}
                disabled={isHistoricalLoading}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <History className={`h-4 w-4 mr-2 ${isHistoricalLoading ? 'animate-spin' : ''}`} />
                Continue {fetchingMode === 'newer' ? 'Newer' : 'Older'}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryFetch}
              disabled={isLoading}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="flex-1 glass-card rounded-2xl p-4 lg:p-6 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
          <TweetClassifier tweets={filteredTweets} isLoading={isLoading} />
        </div>
      </motion.div>
    </div>
  );
};

export default TweetAnalyzer;
