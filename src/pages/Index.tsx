import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, Network, Send, History, ArrowLeft,
  MessageCircle, Activity, Radio, Search
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { WalletAuthButton } from '@/components/WalletAuthButton';

import { AppHeader } from '@/components/AppHeader';
import PredictionCard from '@/components/PredictionCard';
import PerformanceChart from '@/components/PerformanceChart';
import ChatSection from '@/components/ChatSection';
import LeaderboardSection from '@/components/LeaderboardSection';

import { marketIntelligence } from '@/data/marketIntelligence';
import { marketCalls } from '@/data/marketCalls';
import { demoRankChanges, demoROI } from '@/data/demoData';
import { leaderboardData } from '@/data/leaderboardData';

import { formatJapanTime } from '@/utils/dateUtils';
import { generatePerformanceData } from '@/utils/performanceUtils';

const Index = () => {
  const { toast } = useToast();
  const { publicKey } = useWallet();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      if (!publicKey) {
        setIsVerified(false);
        return;
      }

      const { data, error } = await supabase
        .from('wallet_auth')
        .select('nft_verified')
        .eq('wallet_address', publicKey.toString())
        .maybeSingle();

      if (error) {
        console.error('Error checking verification:', error);
        setIsVerified(false);
        return;
      }

      setIsVerified(data?.nft_verified || false);
    };

    checkVerification();
  }, [publicKey]);

  const [currentInsight, setCurrentInsight] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ 
    message: string, 
    timestamp: string, 
    isUser?: boolean, 
    type?: 'chat' | 'intel' | 'history',
    contextData?: {
      showChart?: boolean,
      showCalls?: boolean
    }
  }>>([]);
  const [predictions, setPredictions] = useState<Array<any>>([]);
  const [userInput, setUserInput] = useState("");
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [filteredHistory, setFilteredHistory] = useState<Array<any>>(marketCalls.slice(0, 6));
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: 'rank' | 'roi' | 'score' | null,
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomCall = marketCalls[Math.floor(Math.random() * marketCalls.length)];
      const newCall = {
        ...randomCall,
        timestamp: formatJapanTime(new Date())
      };
      setPredictions(prev => [newCall, ...prev].slice(0, 100));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIntel = marketIntelligence[Math.floor(Math.random() * marketIntelligence.length)];
      const timestamp = formatJapanTime(new Date());
      setChatHistory(prev => [...prev, { 
        message: randomIntel, 
        timestamp, 
        type: 'intel'
      }]);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: 'smooth',
        block: 'end',
      };
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (!isHistoryView) {
      setPerformanceData(null);
      setFilteredHistory(marketCalls.slice(0, 6));
    }
  }, [isHistoryView]);

  const handleUserMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const timestamp = formatJapanTime(new Date());
    
    setChatHistory(prev => [...prev, { 
      message: userInput, 
      timestamp, 
      isUser: true, 
      type: 'chat' 
    }]);

    setIsThinking(true);
    const query = userInput.toLowerCase();
    const isWinRateQuery = query.includes('win rate');
    const isCallsQuery = query.includes('calls') || query.includes('trades');
    const isHsakaQuery = query.includes('hsaka');
    const year = '2024';

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isHsakaQuery) {
      setIsHistoryView(true);
      
      if (isWinRateQuery) {
        const performance = generatePerformanceData(marketCalls, year);
        setPerformanceData(performance);
        setFilteredHistory([]); // Clear the calls when showing win rate

        setChatHistory(prev => [...prev, { 
          message: `Found Hsaka's performance data for ${year}. Overall win rate is ${performance.overall}%. <span class="text-emerald-400 cursor-pointer hover:underline" data-message-id="${Date.now()}">Click here</span> to view the monthly breakdown.`,
          timestamp: formatJapanTime(new Date()),
          type: 'history',
          contextData: {
            showChart: true,
            showCalls: false
          }
        }]);

        toast({
          title: "Performance Data Found",
          description: `Win rate for ${year}: ${performance.overall}%`,
          duration: 3000,
        });
      }
      else if (isCallsQuery) {
        const filteredCalls = marketCalls.filter(call => 
          call.traderProfile.toLowerCase() === 'hsaka'
        ).map(call => ({
          market: call.market,
          direction: call.direction,
          confidence: call.confidence,
          roi: call.roi,
          trader: call.traderProfile,
          timestamp: call.timestamp
        }));

        setFilteredHistory(filteredCalls);
        setPerformanceData(null);

        setChatHistory(prev => [...prev, { 
          message: `Found ${filteredCalls.length} trading calls from Hsaka. <span class="text-emerald-400 cursor-pointer hover:underline" data-message-id="${Date.now()}">Click here</span> to view the trades.`,
          timestamp: formatJapanTime(new Date()),
          type: 'history',
          contextData: {
            showChart: false,
            showCalls: true
          }
        }]);

        toast({
          title: "Trading Calls Found",
          description: `Found ${filteredCalls.length} trading calls from Hsaka in ${year}`,
          duration: 3000,
        });
      }
    }

    setIsThinking(false);
    setUserInput("");
  };

  useEffect(() => {
    const handleChatClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.dataset.messageId) {
        const messageId = target.dataset.messageId;
        const clickedMessage = chatHistory.find(msg => 
          msg.message.includes(messageId)
        );

        if (clickedMessage?.contextData) {
          setIsHistoryView(true);
          if (clickedMessage.contextData.showChart) {
            const year = '2024';
            const performance = generatePerformanceData(marketCalls, year);
            setPerformanceData(performance);
            setFilteredHistory([]); // Clear the calls when showing chart
            setTimeout(() => {
              if (chartRef.current) {
                chartRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          } else if (clickedMessage.contextData.showCalls) {
            const filteredCalls = marketCalls.filter(call => 
              call.traderProfile.toLowerCase() === 'hsaka'
            ).map(call => ({
              market: call.market,
              direction: call.direction,
              confidence: call.confidence,
              roi: call.roi,
              trader: call.traderProfile,
              timestamp: call.timestamp
            }));
            setPerformanceData(null);
            setFilteredHistory(filteredCalls);
            setTimeout(() => {
              const firstCard = document.querySelector('.prediction-card');
              if (firstCard) {
                firstCard.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }
        }
      }
    };

    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('click', handleChatClick);
    }

    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('click', handleChatClick);
      }
    };
  }, [chatHistory]);

  const sortedAndFilteredLeaderboard = useMemo(() => {
    let filtered = leaderboardData.filter(trader =>
      trader.trader.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (sortConfig.key === 'rank') {
          const aChange = demoRankChanges[leaderboardData.indexOf(a) % demoRankChanges.length];
          const bChange = demoRankChanges[leaderboardData.indexOf(b) % demoRankChanges.length];
          return sortConfig.direction === 'asc' ? aChange - bChange : bChange - aChange;
        }
        if (sortConfig.key === 'roi') {
          const aROI = demoROI[leaderboardData.indexOf(a) % 20];
          const bROI = demoROI[leaderboardData.indexOf(b) % 20];
          return sortConfig.direction === 'asc' ? aROI - bROI : bROI - aROI;
        }
        if (sortConfig.key === 'score') {
          return sortConfig.direction === 'asc' ? 
            a.score - b.score : 
            b.score - a.score;
        }
        return 0;
      });
    }

    return filtered;
  }, [searchQuery, sortConfig]);

  const handleSort = (key: 'rank' | 'roi' | 'score') => {
    setSortConfig(current => ({
      key,
      direction: 
        current.key === key && current.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    }));

    toast({
      title: `Sorted by ${key}`,
      description: `Order: ${sortConfig.direction === 'asc' ? 'ascending' : 'descending'}`,
      duration: 2000,
    });
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen overflow-hidden bat-grid">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="container mx-auto p-4 h-screen flex flex-col items-center justify-center"
        >
          <AppHeader />
          <div className="text-center space-y-4">
            <h1 className="text-2xl text-white font-bold">Connect Your Wallet</h1>
            <p className="text-emerald-400">Connect your Solana wallet to access the chat and CODEC features</p>
          </div>
          <WalletAuthButton />
        </motion.div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen overflow-hidden bat-grid">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="container mx-auto p-4 h-screen flex flex-col items-center justify-center"
        >
          <AppHeader />
          <div className="text-center space-y-4">
            <h1 className="text-2xl text-white font-bold">NFT Verification Required</h1>
            <p className="text-emerald-400">You need to own an NFT from the required collection to access this feature</p>
          </div>
          <WalletAuthButton />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bat-grid">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 h-screen flex flex-col relative"
      >
        <WalletAuthButton />
        <AppHeader />
        
        <div className="grid grid-cols-2 gap-4 h-[90vh]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="glass-card rounded-2xl overflow-hidden relative p-6 flex-1 flex flex-col h-full">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
              
              <Tabs defaultValue="chat" className="flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <TabsList className="bg-black/40 border border-emerald-500/20 p-1 rounded-xl">
                    <TabsTrigger 
                      value="chat"
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger 
                      value="codec"
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all duration-200"
                    >
                      <Radio className="w-4 h-4 mr-2" />
                      CODEC
                    </TabsTrigger>
                    <TabsTrigger 
                      value="leaderboard"
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 transition-colors"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Leaderboard
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="chat" className="flex-1 relative mt-0">
                  <ChatSection
                    chatHistory={chatHistory}
                    userInput={userInput}
                    onUserInput={setUserInput}
                    onSubmit={handleUserMessage}
                    containerRef={chatContainerRef}
                    isThinking={isThinking}
                  />
                </TabsContent>

                <TabsContent value="codec" className="flex-1 relative mt-0">
                  <ChatSection
                    chatHistory={chatHistory}
                    userInput={userInput}
                    onUserInput={setUserInput}
                    onSubmit={handleUserMessage}
                    containerRef={chatContainerRef}
                    showIntel={true}
                    isThinking={isThinking}
                  />
                </TabsContent>

                <TabsContent value="leaderboard" className="flex-1 relative mt-0">
                  <LeaderboardSection
                    traders={sortedAndFilteredLeaderboard}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl relative overflow-hidden p-6"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
            <div className="h-full flex flex-col">
              <AnimatePresence mode="sync">
                <motion.div 
                  key={isHistoryView ? 'history' : 'intel'}
                  initial={{ 
                    opacity: 0,
                    scale: 0.9,
                    y: 20
                  }}
                  animate={{ 
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: {
                      duration: 0.5,
                      ease: "easeInOut"
                    }
                  }}
                  exit={{ 
                    opacity: 0,
                    scale: 1.1,
                    y: -20,
                    transition: {
                      duration: 0.3
                    }
                  }}
                  className="relative"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{
                          rotate: isHistoryView ? [0, 180, 360] : 0,
                        }}
                        transition={{
                          duration: 0.5,
                          ease: "easeInOut"
                        }}
                      >
                        {isHistoryView ? (
                          <History className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-emerald-400" />
                        )}
                      </motion.div>
                      <motion.div
                        layout
                        className="relative"
                      >
                        <motion.h2 
                          className="text-xl font-bold text-white flex items-center gap-2"
                        >
                          {isHistoryView ? 'MARKET_HISTORY' : 'MARKET_INTEL'}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className={`h-2 w-2 rounded-full ${isHistoryView ? 'bg-blue-400' : 'bg-emerald-400'}`}
                          />
                        </motion.h2>
                        <motion.div 
                          className="absolute -bottom-1 left-0 right-0 h-[2px]"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          style={{
                            background: isHistoryView 
                              ? 'linear-gradient(90deg, rgba(59,130,246,0) 0%, rgba(59,130,246,0.5) 50%, rgba(59,130,246,0) 100%)'
                              : 'linear-gradient(90deg, rgba(16,185,129,0) 0%, rgba(16,185,129,0.5) 50%, rgba(16,185,129,0) 100%)'
                          }}
                        />
                      </motion.div>
                    </div>
                    {isHistoryView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsHistoryView(false)}
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Intel
                      </Button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                <AnimatePresence mode="wait">
                  {filteredHistory.length > 0 && (
                    <div>
                      {filteredHistory.map((prediction, index) => (
                        <motion.div
                          key={`history-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <PredictionCard
                            symbol={prediction.market}
                            prediction={prediction.direction === "LONG" ? "up" : "down"}
                            confidence={prediction.confidence}
                            timestamp={prediction.timestamp}
                            traderText={prediction.analysis || `Trading call by ${prediction.trader}`}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {!isHistoryView && predictions.map((prediction, index) => (
                    <motion.div
                      key={`intel-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <PredictionCard
                        symbol={prediction.market}
                        prediction={prediction.direction === "LONG" ? "up" : "down"}
                        confidence={prediction.confidence}
                        timestamp={prediction.timestamp}
                        traderText={prediction.analysis || `Trading call by ${prediction.trader}`}
                      />
                    </motion.div>
                  ))}
                  {performanceData && (
                    <motion.div
                      ref={chartRef}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="glass-card p-4 rounded-xl border border-emerald-500/20"
                    >
                      <PerformanceChart monthlyData={performanceData.monthlyData} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
