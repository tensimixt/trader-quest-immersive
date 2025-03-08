import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowDown, ArrowUp, MessageCircle, Quote, RefreshCw, Filter, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  author: {
    userName: string;
    name: string;
    profilePicture: string;
  };
  isReply: boolean;
  isQuote: boolean;
  inReplyToId?: string;
  quoted_tweet?: {
    text: string;
    author?: {
      userName: string;
      name?: string;
      profilePicture?: string;
    };
    entities?: {
      media?: {
        type: string;
        media_url_https: string;
        expanded_url: string;
      }[];
    };
    extendedEntities?: {
      media?: {
        type: string;
        media_url_https: string;
        expanded_url: string;
      }[];
    };
  };
  entities?: {
    media?: {
      type: string;
      media_url_https: string;
      expanded_url: string;
    }[];
  };
  extendedEntities?: {
    media?: {
      type: string;
      media_url_https: string;
      expanded_url: string;
    }[];
  };
}

interface ClassifiedTweet {
  id: string;
  market: string;
  direction: string;
  confidence: number;
  tweetText: string;
  screenName: string;
  isQuote: boolean;
  isReply: boolean;
  quoteTweetText?: string;
  quoteAuthor?: string;
  replyTweetText?: string;
  timestamp: string;
  media?: {
    type: string;
    url: string;
    expandedUrl: string;
  }[];
}

interface TweetClassifierProps {
  tweets: any[];
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

  const classifyTweet = (tweet: Tweet): ClassifiedTweet => {
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

  const runClassification = () => {
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
    
    try {
      const classified = rawTweets.map(classifyTweet);
      setClassifiedTweets(classified);
      
      toast({
        title: "Classification complete",
        description: `Classified ${classified.length} tweets`,
        duration: 3000,
      });
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
        (tweet.quoteTweetText && tweet.quoteTweetText.toLowerCase().includes(query));
        
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
    <div className="glass-card rounded-xl p-4 h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Tweet Classifier
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </h2>
        
        <div className="flex gap-2">
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
            <Filter className="w-4 h-4 mr-2" />
            Classify
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-transparent border-b border-emerald-400/20 rounded-none mb-4 px-0 gap-4">
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
        
        <TabsContent value="raw" className="flex-1 flex flex-col overflow-hidden">
          <div className="relative mb-4">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400/50" />
            <Input
              className="pl-8 bg-black/30 border-emerald-400/20 text-white placeholder:text-white/50"
              placeholder="Search tweets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
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
        
        <TabsContent value="classified" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
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
                <p className="text-emerald-400 mt-2">Classifying tweets...</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TweetClassifier;
