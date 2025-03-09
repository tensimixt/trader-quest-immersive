
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowDown, ArrowUp, MessageCircle, Quote, RefreshCw, Filter, Image as ImageIcon, Brain } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tweet, ClassifiedTweet } from "@/types/tweetTypes";

interface TweetClassifierProps {
  tweets: Tweet[];
  isLoading: boolean;
}

const TweetClassifier: React.FC<TweetClassifierProps> = ({ tweets: initialTweets, isLoading: externalLoading }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(externalLoading);
  const [rawTweets, setRawTweets] = useState<Tweet[]>(initialTweets);
  const [classifiedTweets, setClassifiedTweets] = useState<ClassifiedTweet[]>([]);
  const [activeTab, setActiveTab] = useState('raw');
  const [marketFilter, setMarketFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [classificationMethod, setClassificationMethod] = useState<'mistral' | 'local'>('mistral');
  
  useEffect(() => {
    setRawTweets(initialTweets);
    setIsLoading(externalLoading);
  }, [initialTweets, externalLoading]);
  
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
              profilePicture: tweet.quoted_tweet.author?.profilePicture
            }
          } : undefined,
          entities: tweet.entities,
          extendedEntities: tweet.extendedEntities
        }));
        
        setRawTweets(formattedTweets);
        toast({
          title: "Tweets loaded successfully",
          description: `Retrieved ${formattedTweets.length} tweets`,
          duration: 3000,
        });
      } else {
        throw new Error('Invalid response format from function');
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
      toast({
        title: "Error fetching tweets",
        description: "Failed to load tweets from API, using sample data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTweetMedia = (tweet: Tweet) => {
    const mediaItems = tweet.extendedEntities?.media || tweet.entities?.media || [];
    return mediaItems.map(media => ({
      type: media.type,
      url: media.media_url_https,
      expandedUrl: media.expanded_url
    }));
  };

  const getQuoteTweetMedia = (tweet: any) => {
    if (!tweet.quoted_tweet) return [];
    
    const quotedMedia = tweet.quoted_tweet.extendedEntities?.media || 
                        tweet.quoted_tweet.entities?.media || [];
    
    return quotedMedia.map((media: any) => ({
      type: media.type,
      url: media.media_url_https,
      expandedUrl: media.expanded_url
    }));
  };

  // Local classification fallback
  const classifyTweetLocally = (tweet: Tweet): ClassifiedTweet => {
    let market = "UNKNOWN";
    let direction = "NEUTRAL";
    let confidence = 50;
    
    const tweetText = tweet.text.toLowerCase();
    
    if (tweetText.includes("btc") || tweetText.includes("bitcoin") || tweetText.includes("pin-bar")) {
      market = "BTC";
    } else if (tweetText.includes("eth") || tweetText.includes("ethereum")) {
      market = "ETH";
    } else if (tweetText.includes("forex") || tweetText.includes("ict")) {
      market = "FOREX";
    } else if (tweetText.includes("crypto") || tweet.author.userName === "Pentosh1") {
      market = "CRYPTO";
    }
    
    if (tweetText.includes("bull") || tweetText.includes("buy") || tweetText.includes("long") || tweetText.includes("million x")) {
      direction = "UP";
      confidence = 75;
    } else if (tweetText.includes("bear") || tweetText.includes("sell") || tweetText.includes("short")) {
      direction = "DOWN";
      confidence = 75;
    }
    
    if (tweet.author.userName === "MuroCrypto" || tweet.author.userName === "Pentosh1") {
      confidence += 15;
    }
    
    confidence = Math.min(confidence, 95);
    
    return {
      id: tweet.id,
      market,
      direction,
      confidence,
      explanation: "Classified using keyword matching. Found relevant terms that indicate this market and direction.",
      tweetText: tweet.text,
      screenName: tweet.author.userName,
      isQuote: tweet.isQuote,
      isReply: tweet.isReply,
      quoteTweetText: tweet.quoted_tweet?.text,
      quoteAuthor: tweet.quoted_tweet?.author?.userName,
      replyTweetText: tweet.isReply ? "Reply context not available" : undefined,
      timestamp: tweet.createdAt,
      media: getTweetMedia(tweet).length > 0 ? getTweetMedia(tweet) : undefined
    };
  };

  // Classify using Mistral AI
  const classifyTweetWithMistral = async (tweet: Tweet): Promise<ClassifiedTweet> => {
    try {
      const { data, error } = await supabase.functions.invoke('classify-tweet', {
        body: { tweet }
      });
      
      if (error) {
        console.error('Error calling classify-tweet function:', error);
        throw new Error(`Classification error: ${error.message}`);
      }
      
      return {
        id: tweet.id,
        market: data.market,
        direction: data.direction,
        confidence: data.confidence,
        explanation: data.explanation,
        tweetText: tweet.text,
        screenName: tweet.author.userName,
        isQuote: tweet.isQuote,
        isReply: tweet.isReply,
        quoteTweetText: tweet.quoted_tweet?.text,
        quoteAuthor: tweet.quoted_tweet?.author?.userName,
        replyTweetText: tweet.isReply ? "Reply context not available" : undefined,
        timestamp: tweet.createdAt,
        media: getTweetMedia(tweet).length > 0 ? getTweetMedia(tweet) : undefined
      };
    } catch (error) {
      console.error('Error classifying tweet with Mistral:', error);
      // Fall back to local classification
      toast({
        title: "AI classification failed",
        description: "Falling back to local classification",
        variant: "destructive",
        duration: 3000,
      });
      return classifyTweetLocally(tweet);
    }
  };

  const runClassification = async () => {
    if (rawTweets.length === 0) {
      toast({
        title: "No tweets to classify",
        description: "Please fetch tweets first",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsLoading(true);
    setClassifiedTweets([]);
    
    try {
      if (classificationMethod === 'mistral') {
        toast({
          title: "Using Mistral AI",
          description: "Classifying tweets using AI...",
          duration: 3000,
        });
        
        // Process tweets sequentially to avoid overwhelming the API
        const classified = [];
        let completedCount = 0;
        
        for (const tweet of rawTweets) {
          const classifiedTweet = await classifyTweetWithMistral(tweet);
          classified.push(classifiedTweet);
          completedCount++;
          
          // Update progress every few tweets
          if (completedCount % 5 === 0 || completedCount === rawTweets.length) {
            toast({
              title: "Classification in progress",
              description: `Classified ${completedCount} of ${rawTweets.length} tweets`,
              duration: 2000,
            });
          }
        }
        
        setClassifiedTweets(classified);
      } else {
        // Use local classification
        const classified = rawTweets.map(classifyTweetLocally);
        setClassifiedTweets(classified);
      }
      
      toast({
        title: "Classification complete",
        description: `Classified ${rawTweets.length} tweets`,
        duration: 3000,
      });
      
      // Switch to classified tab
      setActiveTab('classified');
    } catch (error) {
      console.error("Error classifying tweets:", error);
      toast({
        title: "Classification error",
        description: "Could not classify tweets",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClassifiedTweets = classifiedTweets.filter(tweet => {
    let passes = true;
    
    if (marketFilter !== 'all' && tweet.market !== marketFilter) {
      passes = false;
    }
    
    if (directionFilter !== 'all' && tweet.direction !== directionFilter) {
      passes = false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesQuery = 
        tweet.tweetText.toLowerCase().includes(query) ||
        tweet.screenName.toLowerCase().includes(query) ||
        (tweet.quoteTweetText && tweet.quoteTweetText.toLowerCase().includes(query)) ||
        (tweet.explanation && tweet.explanation.toLowerCase().includes(query));
        
      if (!matchesQuery) {
        passes = false;
      }
    }
    
    return passes;
  });

  const renderMedia = (media?: { type: string; url: string; expandedUrl: string }[]) => {
    if (!media || media.length === 0) return null;
    
    return (
      <div className="mt-2 grid gap-2">
        {media.map((item, index) => (
          item.type === 'photo' && (
            <div key={index} className="relative rounded overflow-hidden">
              <img 
                src={item.url} 
                alt="Tweet media" 
                className="w-full h-auto rounded border border-white/10"
                loading="lazy"
              />
            </div>
          )
        ))}
      </div>
    );
  };

  const renderQuoteTweet = (tweet: any) => {
    if (!tweet.quoted_tweet) return null;

    const quotedMedia = getQuoteTweetMedia(tweet);
    
    return (
      <div className="mt-2 p-2 bg-white/5 rounded border border-white/10 text-sm">
        <div className="flex items-center gap-2 mb-1">
          {tweet.quoted_tweet.author?.profilePicture && (
            <img 
              src={tweet.quoted_tweet.author.profilePicture} 
              alt="Quote author" 
              className="w-5 h-5 rounded-full"
            />
          )}
          <div>
            {tweet.quoted_tweet.author?.name && (
              <span className="text-white/90 font-medium">{tweet.quoted_tweet.author.name}</span>
            )}
            {tweet.quoted_tweet.author?.userName && (
              <span className="text-xs text-emerald-400 ml-1">@{tweet.quoted_tweet.author.userName}</span>
            )}
          </div>
        </div>
        <p className="text-white/70">{tweet.quoted_tweet.text}</p>
        
        {quotedMedia.length > 0 && (
          <div className="mt-2">
            {quotedMedia.map((media: any, idx: number) => (
              media.type === 'photo' && (
                <img 
                  key={idx}
                  src={media.url} 
                  alt="Quote media" 
                  className="w-full h-auto rounded border border-white/10 mt-1"
                  loading="lazy"
                />
              )
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (rawTweets.length === 0 && !isLoading) {
      fetchTweets();
    }
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Tweet Classifier
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </h2>
        
        <div className="flex gap-2">
          <Select value={classificationMethod} onValueChange={(value: any) => setClassificationMethod(value)}>
            <SelectTrigger className="w-[180px] border-emerald-400/30 bg-black/30">
              <SelectValue placeholder="Classification Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mistral">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>Mistral AI</span>
                </div>
              </SelectItem>
              <SelectItem value="local">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-400" />
                  <span>Local Rules</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchTweets}
            disabled={isLoading}
            className="text-emerald-400 border-emerald-400/30"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Fetch Tweets
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runClassification}
            disabled={isLoading || rawTweets.length === 0}
            className="text-blue-400 border-blue-400/30"
          >
            <Brain className="w-4 h-4 mr-2" />
            Classify
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
        <TabsList className="bg-transparent border-b border-emerald-400/20 rounded-none mb-4 px-0 gap-4 flex-shrink-0">
          <TabsTrigger 
            value="raw" 
            className="data-[state=active]:bg-emerald-400/10 data-[state=active]:text-emerald-400 rounded px-4"
          >
            Raw Tweets ({rawTweets.length})
          </TabsTrigger>
          <TabsTrigger 
            value="classified" 
            className="data-[state=active]:bg-emerald-400/10 data-[state=active]:text-emerald-400 rounded px-4"
          >
            Classified ({classifiedTweets.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="raw" className="flex-1 flex flex-col overflow-hidden h-full">
          <div className="relative mb-4 flex-shrink-0">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400/50" />
            <Input
              className="pl-8 bg-black/30 border-emerald-400/20 text-white placeholder:text-white/50"
              placeholder="Search tweets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 min-h-[600px]">
            {rawTweets.map((tweet) => (
              <motion.div 
                key={tweet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-3 rounded-lg border border-white/5"
              >
                <div className="flex gap-3">
                  <img 
                    src={tweet.author.profilePicture || "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png"} 
                    alt={tweet.author.name} 
                    className="w-10 h-10 rounded-full"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{tweet.author.name}</span>
                      <span className="text-gray-400 text-sm">@{tweet.author.userName}</span>
                    </div>
                    
                    <p className="text-white/90 my-1">{tweet.text}</p>
                    
                    {renderMedia(getTweetMedia(tweet))}
                    
                    {tweet.quoted_tweet && renderQuoteTweet(tweet)}
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                      <span>{new Date(tweet.createdAt).toLocaleString()}</span>
                      
                      {tweet.isReply && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          Reply
                        </span>
                      )}
                      
                      {tweet.isQuote && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Quote className="w-3 h-3" />
                          Quote
                        </span>
                      )}
                      
                      {getTweetMedia(tweet).length > 0 && (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          Media
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {rawTweets.length === 0 && !isLoading && (
              <div className="text-center py-10 text-white/50">
                <p>No tweets available. Use the "Fetch Tweets" button to load tweets.</p>
              </div>
            )}
            
            {isLoading && (
              <div className="text-center py-10">
                <div className="inline-block w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                <p className="text-emerald-400 mt-2">Loading tweets...</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="classified" className="flex-1 flex flex-col overflow-hidden h-full">
          <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400/50" />
              <Input
                className="pl-8 bg-black/30 border-emerald-400/20 text-white placeholder:text-white/50"
                placeholder="Search classified tweets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={marketFilter} onValueChange={setMarketFilter}>
              <SelectTrigger className="w-[180px] border-emerald-400/20 bg-black/30">
                <SelectValue placeholder="Filter by market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Markets</SelectItem>
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                <SelectItem value="CRYPTO">Crypto (General)</SelectItem>
                <SelectItem value="FOREX">Forex</SelectItem>
                <SelectItem value="UNKNOWN">Unknown</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[180px] border-emerald-400/20 bg-black/30">
                <SelectValue placeholder="Filter by direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="UP">Bullish (UP)</SelectItem>
                <SelectItem value="DOWN">Bearish (DOWN)</SelectItem>
                <SelectItem value="NEUTRAL">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 min-h-[600px]">
            {filteredClassifiedTweets.map((tweet) => (
              <motion.div 
                key={tweet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-3 rounded-lg border border-white/5"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-gray-800/50">
                    @{tweet.screenName}
                  </Badge>
                  
                  <Badge variant="outline" className={`${
                    tweet.market === "BTC" ? "bg-orange-500/20 text-orange-300" :
                    tweet.market === "ETH" ? "bg-purple-500/20 text-purple-300" :
                    tweet.market === "FOREX" ? "bg-blue-500/20 text-blue-300" :
                    tweet.market === "CRYPTO" ? "bg-emerald-500/20 text-emerald-300" :
                    "bg-gray-500/20 text-gray-300"
                  }`}>
                    {tweet.market}
                  </Badge>
                  
                  <Badge variant="outline" className={`${
                    tweet.direction === "UP" ? "bg-green-500/20 text-green-300" :
                    tweet.direction === "DOWN" ? "bg-red-500/20 text-red-300" :
                    "bg-gray-500/20 text-gray-300"
                  }`}>
                    {tweet.direction === "UP" ? (
                      <span className="flex items-center gap-1">
                        <ArrowUp className="w-3 h-3" />
                        BULLISH
                      </span>
                    ) : tweet.direction === "DOWN" ? (
                      <span className="flex items-center gap-1">
                        <ArrowDown className="w-3 h-3" />
                        BEARISH
                      </span>
                    ) : (
                      "NEUTRAL"
                    )}
                  </Badge>
                  
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-300">
                    Confidence: {tweet.confidence}%
                  </Badge>
                  
                  {tweet.media && tweet.media.length > 0 && (
                    <Badge variant="outline" className="bg-purple-500/20 text-purple-300">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      Media
                    </Badge>
                  )}
                </div>
                
                <p className="text-white/90 my-2">{tweet.tweetText}</p>
                
                {tweet.explanation && (
                  <div className="mt-2 p-2 bg-purple-500/5 rounded border border-purple-500/10 text-sm">
                    <div className="flex items-center gap-1 mb-1 text-xs text-purple-400">
                      <Brain className="w-3 h-3" />
                      <span>AI Analysis</span>
                    </div>
                    <p className="text-white/80">{tweet.explanation}</p>
                  </div>
                )}
                
                {renderMedia(tweet.media)}
                
                {tweet.isQuote && tweet.quoteTweetText && (
                  <div className="mt-2 p-2 bg-white/5 rounded border border-white/10 text-sm">
                    <div className="flex items-center gap-1 mb-1 text-xs text-emerald-400">
                      <Quote className="w-3 h-3" />
                      {tweet.quoteAuthor ? (
                        <span>Quote Tweet from @{tweet.quoteAuthor}</span>
                      ) : (
                        <span>Quote Tweet</span>
                      )}
                    </div>
                    <p className="text-white/70">{tweet.quoteTweetText}</p>
                  </div>
                )}
                
                {tweet.isReply && tweet.replyTweetText && (
                  <div className="mt-2 p-2 bg-white/5 rounded border border-white/10 text-sm">
                    <div className="flex items-center gap-1 mb-1 text-xs text-emerald-400">
                      <MessageCircle className="w-3 h-3" />
                      <span>Reply To</span>
                    </div>
                    <p className="text-white/70">{tweet.replyTweetText}</p>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(tweet.timestamp).toLocaleString()}
                </div>
              </motion.div>
            ))}
            
            {(classifiedTweets.length === 0 || filteredClassifiedTweets.length === 0) && !isLoading && (
              <div className="text-center py-10 text-white/50">
                {classifiedTweets.length === 0 ? (
                  <p>No classified tweets available. Use the "Classify" button to analyze tweets.</p>
                ) : (
                  <p>No tweets match your filter criteria.</p>
                )}
              </div>
            )}
            
            {isLoading && (
              <div className="text-center py-10">
                <div className="inline-block w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                <p className="text-emerald-400 mt-2">Classifying tweets with AI...</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TweetClassifier;
