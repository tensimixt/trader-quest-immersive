import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, RefreshCcw, ArrowLeft, History } from 'lucide-react';
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
  }, []);

  const fetchTweets = async () => {
    setIsLoading(true);
    try {
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
    } catch (error) {
      console.error('Error fetching tweets:', error);
      toast.error('Failed to load tweets from API, using sample data');
      
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
    setIsHistoricalLoading(true);
    try {
      if (startNew) {
        setFetchingMode('newer');
        setCurrentCursor(null);
      }
      
      const result = await supabase.functions.invoke<HistoricalTweetBatch>('twitter-historical', {
        body: { 
          cursor: currentCursor,
          batchSize: 5,
          startNew: startNew
        }
      });
      
      if (result.error) {
        throw new Error(`Function error: ${result.error.message}`);
      }
      
      const data = result.data;
      console.log('Historical tweets response:', data);
      
      if (data?.success) {
        setCurrentCursor(data.nextCursor);
        toast.success(`Fetched ${data.totalFetched} historical tweets from ${data.pagesProcessed || 'multiple'} pages`);
        
        if (data.nextCursor) {
          toast.info(`More historical tweets available. Click "Fetch ${fetchingMode === 'newer' ? 'Newer' : 'Older'}" to get more.`);
        } else {
          toast.info(`All ${fetchingMode === 'newer' ? 'recent' : 'historical'} tweets have been fetched.`);
        }
      } else {
        throw new Error(data?.error || 'Failed to fetch historical tweets');
      }
    } catch (error) {
      console.error('Error fetching historical tweets:', error);
      toast.error('Failed to fetch historical tweets');
    } finally {
      setIsHistoricalLoading(false);
    }
  };

  const toggleFetchingMode = () => {
    const newMode = fetchingMode === 'newer' ? 'older' : 'newer';
    setFetchingMode(newMode);
    setCurrentCursor(null);
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
                onClick={() => toggleFetchingMode()}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                {fetchingMode === 'older' ? "Switch to Newer" : "Switch to Older"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHistoricalTweets(fetchingMode === 'newer')}
                disabled={isHistoricalLoading}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <History className={`h-4 w-4 mr-2 ${isHistoricalLoading ? 'animate-spin' : ''}`} />
                Fetch {fetchingMode === 'newer' ? 'Newer' : 'Older'}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTweets}
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
