import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, ArrowLeft, History, AlertTriangle, Settings, Info, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import { AppHeader } from '@/components/AppHeader';
import TweetClassifier from '@/components/TweetClassifier';
import { marketIntelligence } from '@/data/marketIntelligence';
import { supabase } from '@/integrations/supabase/client';
import { fetchAndStoreNewerTweets } from '@/integrations/twitter/client';
import { HistoricalTweetBatch } from '@/types/tweetTypes';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Slider
} from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

interface FetchHistoricalResult {
  success: boolean;
  isAtEnd: boolean;
  hasData: boolean;
}

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
  const [batchSize, setBatchSize] = useState(20);
  const [tweetsPerRequest, setTweetsPerRequest] = useState(20);
  const [isPossiblyAtEnd, setIsPossiblyAtEnd] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAutoClickEnabled, setIsAutoClickEnabled] = useState(true);
  const [isNewTweetsLoading, setIsNewTweetsLoading] = useState(false);
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
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchTweets();
      }
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      if (autoClickTimeoutRef.current) {
        clearTimeout(autoClickTimeoutRef.current);
      }
    };
  }, []);

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
        toast.error('Multiple API errors detected. The Twitter API may be experiencing issues.', {
          duration: 5000,
          icon: <AlertTriangle className="text-red-500" />
        });
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
            `Only ${data.totalFetched} tweets retrieved despite ${data.pagesProcessed} requests. You may have reached the end of available data.`, 
            { duration: 5000 }
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
        toast.error('Multiple API errors detected. The Twitter API may be experiencing issues.', {
          duration: 5000,
          icon: <AlertTriangle className="text-red-500" />
        });
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

  const fetchNewerTweets = async () => {
    if (isNewTweetsLoading) return;
    
    setIsNewTweetsLoading(true);
    try {
      const result = await fetchAndStoreNewerTweets();
      
      if (result.success) {
        if (result.tweetsStored > 0) {
          toast.success(`Successfully fetched and stored ${result.tweetsStored} new tweets`);
          fetchTweets();
        } else {
          toast.info('No new tweets found');
        }
      } else {
        toast.error('Failed to fetch newer tweets');
      }
    } catch (error) {
      console.error('Error fetching newer tweets:', error);
      toast.error('Error fetching newer tweets');
    } finally {
      setIsNewTweetsLoading(false);
    }
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
              <Input
                type="text"
                placeholder="Search tweets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/20 border-purple-500/30 text-white placeholder:text-gray-400 w-full"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNewerTweets}
                disabled={isNewTweetsLoading}
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <Download className={`h-4 w-4 mr-2 ${isNewTweetsLoading ? 'animate-spin' : ''}`} />
                Fetch New Tweets
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFetchingMode}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                {fetchingMode === 'older' ? "Switch to Newer" : "Switch to Older"}
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Fetch Settings
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-black/80 border-amber-500/30">
                  <div className="space-y-4">
                    <h4 className="font-medium text-amber-400">Batch Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Batch Size: {batchSize}</span>
                        <span className="text-xs text-amber-400/70">API calls per batch</span>
                      </div>
                      <Slider
                        value={[batchSize]}
                        min={1}
                        max={1000}
                        step={10}
                        onValueChange={(value) => setBatchSize(value[0])}
                        className="w-full"
                      />
                      
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-white/70">Tweets Per Request: {tweetsPerRequest}</span>
                        <span className="text-xs text-amber-400/70">Max tweets per page</span>
                      </div>
                      <Slider
                        value={[tweetsPerRequest]}
                        min={20}
                        max={100}
                        step={20}
                        onValueChange={(value) => setTweetsPerRequest(value[0])}
                        className="w-full"
                      />
                      
                      <div className="mt-4 text-xs text-white/70 p-2 bg-amber-500/10 rounded">
                        <Info className="h-3 w-3 inline-block mr-1 text-amber-400" />
                        <span>Each request typically returns around 20 tweets regardless of the setting. The batch size determines how many API calls will be made in one batch operation.</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-sm text-white/70">Auto-click Continue (5s):</span>
                        <Button
                          variant={isAutoClickEnabled ? "autofetch" : "outline"}
                          size="xs"
                          onClick={() => setIsAutoClickEnabled(!isAutoClickEnabled)}
                          className={isAutoClickEnabled ? "" : "border-gray-500/30 text-gray-400"}
                        >
                          {isAutoClickEnabled ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
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
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      ref={continueButtonRef}
                      variant="outline"
                      size="sm"
                      onClick={handleRetryHistorical}
                      disabled={isHistoricalLoading}
                      className={`border-purple-500/30 text-purple-400 hover:bg-purple-500/10 ${isPossiblyAtEnd ? 'border-yellow-500/50 text-yellow-400' : ''}`}
                    >
                      <History className={`h-4 w-4 mr-2 ${isHistoricalLoading ? 'animate-spin' : ''}`} />
                      Continue {fetchingMode === 'newer' ? 'Newer' : 'Older'}
                      {isPossiblyAtEnd && <AlertTriangle className="h-3 w-3 ml-1 text-yellow-400" />}
                    </Button>
                  </TooltipTrigger>
                  {isPossiblyAtEnd && (
                    <TooltipContent className="bg-black/90 border-yellow-500/50 text-white">
                      <p className="text-xs">You may have reached the end of available tweets, but you can try again if you wish.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
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
          <TweetClassifier 
            tweets={tweetData} 
            isLoading={isLoading} 
            isSearching={isSearching} 
            searchTerm={searchTerm} 
          />
        </div>
      </motion.div>
    </div>
  );
};

export default TweetAnalyzer;
