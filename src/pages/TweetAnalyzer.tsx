
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

const TweetAnalyzer = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tweetData, setTweetData] = useState<any[]>([]);
  
  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/twitter-api');
      if (!response.ok) {
        throw new Error('Failed to fetch tweets');
      }
      
      const data = await response.json();
      setTweetData(data.tweets || []);
      toast.success('Tweets loaded successfully');
    } catch (error) {
      console.error('Error fetching tweets:', error);
      toast.error('Failed to load tweets');
      // If API fails, use the sample data as fallback
      setTweetData(marketIntelligence.filter(item => item.screenName));
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
