import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, RefreshCcw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from '@/hooks/use-mobile';
import { AppHeader } from '@/components/AppHeader';
import TweetClassifier from '@/components/TweetClassifier';
import { marketIntelligence } from '@/data/marketIntelligence';
import { supabase } from '@/integrations/supabase/client';

const TweetAnalyzer = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tweetData, setTweetData] = useState<any[]>([]);
  
  useEffect(() => {
    // Initialize with sample data immediately to prevent blank screen
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
            userName: item.screenName
          }
        } : undefined
      }));
    
    setTweetData(initialTweets);
    // Then try to fetch real data
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    setIsLoading(true);
    try {
      // Call our Supabase Edge Function
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
              userName: tweet.quoted_tweet.author?.userName || "unknown"
            }
          } : undefined
        }));
        
        setTweetData(formattedTweets);
        toast.success('Tweets loaded successfully');
      } else {
        throw new Error('Invalid response format from function');
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
      toast.error('Failed to load tweets from API, using sample data');
      
      // Fall back to sample data
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
              userName: item.screenName
            }
          } : undefined
        }));
      
      setTweetData(sampleTweets);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTweets = tweetData.filter(tweet => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // If using the API response format
    if (tweet.text) {
      return (
        tweet.text.toLowerCase().includes(searchLower) ||
        (tweet.author?.userName || '').toLowerCase().includes(searchLower)
      );
    }
    
    // If using the marketIntelligence format
    return (
      (tweet.message || '').toLowerCase().includes(searchLower) ||
      (tweet.screenName || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen overflow-hidden bat-grid">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 h-screen flex flex-col relative"
      >
        <AppHeader />
        
        <div className="flex items-center justify-between mb-6">
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
        
        <div className="flex-1 glass-card rounded-2xl p-4 lg:p-6 overflow-hidden">
          <TweetClassifier tweets={filteredTweets} isLoading={isLoading} />
        </div>
      </motion.div>
    </div>
  );
};

export default TweetAnalyzer;
