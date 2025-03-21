import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, Network, Send, History, ArrowLeft,
  MessageCircle, Activity, Radio, Search, Loader,
  CreditCard, Bitcoin, BarChart
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { WalletAuthButton } from '@/components/WalletAuthButton';
import { useIsMobile } from '@/hooks/use-mobile';

import { AppHeader } from '@/components/AppHeader';
import PredictionCard from '@/components/PredictionCard';
import PerformanceChart from '@/components/PerformanceChart';
import ChatSection from '@/components/ChatSection';
import LeaderboardSection from '@/components/LeaderboardSection';
import CryptoChartsView from '@/components/CryptoChartsView';

import { marketIntelligence } from '@/data/marketIntelligence';
import { marketCalls } from '@/data/marketCalls';
import { demoRankChanges, demoROI } from '@/data/demoData';
import { leaderboardData } from '@/data/leaderboardData';

import { formatJapanTime } from '@/utils/dateUtils';
import { generatePerformanceData } from '@/utils/performanceUtils';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { publicKey, connected } = useWallet();
  const isMobile = useIsMobile();
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const lastCheckTime = useRef(0);
  const checkInProgress = useRef(false);

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

  const [visibleCards, setVisibleCards] = useState<Array<any>>([]);
  const [showCryptoCharts, setShowCryptoCharts] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkVerification = async () => {
      if (checkInProgress.current || !publicKey || !connected) return;
      
      const now = Date.now();
      if (now - lastCheckTime.current < 5000) return;
      
      checkInProgress.current = true;
      lastCheckTime.current = now;

      try {
        const { data, error } = await supabase
          .from('wallet_auth')
          .select('nft_verified')
          .eq('wallet_address', publicKey.toString())
          .maybeSingle();

        if (error) {
          console.error('Error checking verification:', error);
          setIsVerified(false);
        } else {
          const isNowVerified = data?.nft_verified || false;
          if (isNowVerified !== isVerified) {
            setIsVerified(isNowVerified);
            if (isNowVerified) {
              setActiveTab("chat");
            }
          }
        }
      } catch (err) {
        console.error('Error in verification check:', err);
        setIsVerified(false);
      } finally {
        checkInProgress.current = false;
      }
    };

    if (publicKey && connected && !checkInProgress.current) {
      checkVerification();
    }

    const interval = setInterval(checkVerification, 5000);
    return () => {
      clearInterval(interval);
      checkInProgress.current = false;
    };
  }, [publicKey, connected]);

  useEffect(() => {
    setVisibleCards(marketCalls.slice(0, 2));

    const interval = setInterval(() => {
      setVisibleCards(current => {
        const nextIndex = current.length;
        if (nextIndex >= marketCalls.length) return current;
        
        return [marketCalls[nextIndex], ...current];
      });
    }, 15000);

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
      
      if (isWinRateQuery && isCallsQuery) {
        const performance = generatePerformanceData(marketCalls, year);
        setPerformanceData(performance);
        
        const filteredCalls = marketCalls.filter(call => 
          call.traderProfile.toLowerCase() === 'hsaka'
        ).map(call => ({
          market: call.market,
          direction: call.direction,
          confidence: call.confidence,
          roi: call.roi,
          trader: call.traderProfile,
          timestamp: call.timestamp,
          analysis: call.analysis
        }));
        
        setFilteredHistory(filteredCalls);

        setChatHistory(prev => [...prev, { 
          message: `Found both Hsaka's performance data and trading calls for ${year}. Overall win rate is ${performance.overall}% with ${filteredCalls.length} trades. <span class="text-emerald-400 cursor-pointer hover:underline" data-message-id="${Date.now()}">Click here</span> to view details.`,
          timestamp: formatJapanTime(new Date()),
          type: 'history',
          contextData: {
            showChart: true,
            showCalls: true
          }
        }]);

        toast({
          title: "Performance and Calls Found",
          description: `Win rate for ${year}: ${performance.overall}% with ${filteredCalls.length} trades`,
          duration: 3000,
        });
      }
      else if (isWinRateQuery) {
        const performance = generatePerformanceData(marketCalls, year);
        setPerformanceData(performance);
        setFilteredHistory([]);

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
          timestamp: call.timestamp,
          analysis: call.analysis
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
    } else {
      setChatHistory(prev => [...prev, {
        message: "I understand you're interested in trading data. You can ask me about:\n• Hsaka's win rate in 2024\n• Hsaka's trading calls\n• Trading performance metrics",
        timestamp: formatJapanTime(new Date()),
        type: 'chat'
      }]);
    }

    setIsThinking(false);
    setUserInput("");
  };

  const handleViewChart = () => {
    setIsHistoryView(true);
    
    const lastContextualMessage = [...chatHistory].reverse().find(msg => msg.contextData);
    
    if (lastContextualMessage?.contextData?.showCalls && lastContextualMessage?.contextData?.showChart) {
      const filteredCalls = marketCalls.filter(call => 
        call.traderProfile.toLowerCase() === 'hsaka'
      ).map(call => ({
        market: call.market,
        direction: call.direction,
        confidence: call.confidence,
        roi: call.roi,
        trader: call.traderProfile,
        timestamp: call.timestamp,
        analysis: call.analysis
      }));
      
      setFilteredHistory(filteredCalls);
      
      if (!performanceData) {
        const year = '2024';
        const performance = generatePerformanceData(marketCalls, year);
        setPerformanceData(performance);
      }
    } else if (lastContextualMessage?.contextData?.showCalls) {
      const filteredCalls = marketCalls.filter(call => 
        call.traderProfile.toLowerCase() === 'hsaka'
      ).map(call => ({
        market: call.market,
        direction: call.direction,
        confidence: call.confidence,
        roi: call.roi,
        trader: call.traderProfile,
        timestamp: call.timestamp,
        analysis: call.analysis
      }));
      
      setFilteredHistory(filteredCalls);
      setPerformanceData(null);
    } else if (lastContextualMessage?.contextData?.showChart) {
      if (!performanceData) {
        const year = '2024';
        const performance = generatePerformanceData(marketCalls, year);
        setPerformanceData(performance);
      }
      
      setFilteredHistory([]);
    } else {
      const year = '2024';
      const performance = generatePerformanceData(marketCalls, year);
      setPerformanceData(performance);
      setFilteredHistory([]);
    }
  };

  const handleSort = (key: 'rank' | 'roi' | 'score') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedAndFilteredLeaderboard = useMemo(() => {
    let filtered = leaderboardData.filter(trader =>
      trader.trader.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        return sortConfig.direction === 'asc' ? a.score - b.score : b.score - a.score;
      });
    }

    return filtered;
  }, [searchQuery, sortConfig]);

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
            setFilteredHistory([]);
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
              timestamp: call.timestamp,
              analysis: call.analysis
            }));
            setPerformanceData(null);
            setFilteredHistory(filteredCalls);
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

  const tabs = [
    { value: "chat", icon: <MessageCircle className="w-4 h-4 mr-2" />, label: "Chat" },
    { value: "codec", icon: <Radio className="w-4 h-4 mr-2" />, label: "CODEC" },
    { value: "leaderboard", icon: <Activity className="w-4 h-4 mr-2" />, label: "Leaderboard" },
    { value: "crypto_charts", icon: <BarChart className="w-4 h-4 mr-2" />, label: "Markets" },
    { value: "market_intel", icon: <Network className="w-4 h-4 mr-2" />, label: "Intel", mobileOnly: true }
  ];

  const toggleCryptoCharts = () => {
    setShowCryptoCharts(!showCryptoCharts);
  };

  useEffect(() => {
    const handleResize = () => {
      if (!isMobile && activeTab === "market_intel") {
        setActiveTab("chat");
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile, activeTab]);

  if (isCheckingVerification) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen overflow-hidden bat-grid"
      >
        <div className="container mx-auto p-4 h-screen flex flex-col items-center justify-center">
          <AppHeader />
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            <p className="text-emerald-400">Checking verification status...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!publicKey) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen overflow-hidden bat-grid"
      >
        <div className="container mx-auto p-4 h-screen flex flex-col items-center justify-center">
          <AppHeader />
          <div className="text-center space-y-4">
            <h1 className="text-2xl text-white font-bold tracking-[0.2em] uppercase">Bridge Between Worlds</h1>
            <p className="text-emerald-400 font-mono tracking-wider">Transcend your cryptographic porter to pierce the digital veil of market consciousness</p>
          </div>
          <WalletAuthButton />
        </div>
      </motion.div>
    );
  }

  if (!isVerified) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen overflow-hidden bat-grid"
      >
        <div className="container mx-auto p-4 h-screen flex flex-col items-center justify-center">
          <AppHeader />
          <div className="text-center space-y-4">
            <h1 className="text-2xl text-white font-bold">NFT Verification Required</h1>
            <p className="text-emerald-400">You need to own an NFT from the required collection to access this feature</p>
          </div>
          <WalletAuthButton />
        </div>
      </motion.div>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[90vh]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="glass-card rounded-2xl overflow-hidden relative p-4 lg:p-6 flex-1 flex flex-col h-full">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="flex flex-wrap bg-transparent p-0 gap-2">
                  {tabs.map(tab => (!tab.mobileOnly || (tab.mobileOnly && window.innerWidth < 1024)) && (
                    <TabsTrigger 
                      key={tab.value}
                      value={tab.value}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 transition-colors"
                    >
                      {tab.icon}
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="chat" className="flex-1 relative mt-0">
                  <ChatSection
                    chatHistory={chatHistory}
                    userInput={userInput}
                    onUserInput={setUserInput}
                    onSubmit={handleUserMessage}
                    containerRef={chatContainerRef}
                    isThinking={isThinking}
                    onViewChart={handleViewChart}
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

                <TabsContent value="crypto_charts" className="flex-1 relative mt-0">
                  <CryptoChartsView onClose={() => setActiveTab("chat")} />
                </TabsContent>

                <TabsContent value="market_intel" className="flex-1 relative mt-0 lg:hidden">
                  {!isHistoryView && (
                    <div className="h-full overflow-y-auto custom-scrollbar space-y-4 pb-4">
                      <AnimatePresence mode="popLayout">
                        {visibleCards.map((prediction, index) => (
                          <motion.div
                            key={`prediction-${index}-${prediction.market}`}
                            initial={{ 
                              opacity: 0, 
                              y: 40,
                              scale: 0.95,
                              filter: "blur(10px)"
                            }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              scale: 1,
                              filter: "blur(0px)"
                            }}
                            exit={{ 
                              opacity: 0, 
                              y: -40,
                              scale: 0.95,
                              filter: "blur(10px)"
                            }}
                            transition={{ 
                              duration: 0.7,
                              ease: [0.20, 0.67, 0.22, 1.0],
                              delay: index * 0.1
                            }}
                          >
                            <PredictionCard
                              symbol={prediction.market}
                              prediction={prediction.direction.toLowerCase() as "up" | "down"}
                              confidence={prediction.confidence}
                              timestamp={prediction.timestamp}
                              traderText={prediction.analysis}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl relative overflow-hidden p-4 lg:p-6 h-full order-last lg:order-none hidden lg:block"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
            <div className="h-full flex flex-col max-h-[calc(100vh-8rem)]">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={isHistoryView ? 'history' : (showCryptoCharts ? 'crypto' : 'intel')}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  className="flex-1 flex flex-col h-full overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {isHistoryView ? (
                        <>
                          <History className="w-5 h-5 text-blue-400" />
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            MARKET_HISTORY
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          </h2>
                        </>
                      ) : showCryptoCharts ? (
                        <>
                          <BarChart className="w-5 h-5 text-yellow-400" />
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            MARKETS
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          </h2>
                        </>
                      ) : (
                        <>
                          <Eye className="w-5 h-5 text-emerald-400" />
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            MARKET_INTEL
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </h2>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(isHistoryView || showCryptoCharts) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsHistoryView(false);
                            setShowCryptoCharts(false);
                          }}
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Intel
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {showCryptoCharts && (
                      <CryptoChartsView onClose={() => setShowCryptoCharts(false)} />
                    )}
                    
                    {isHistoryView && performanceData && !showCryptoCharts && (
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
                    
                    {isHistoryView && filteredHistory.length > 0 && !showCryptoCharts && (
                      <AnimatePresence mode="popLayout">
                        {filteredHistory.map((prediction, index) => (
                          <motion.div
                            key={`prediction-${index}-${prediction.market}-${prediction.timestamp}`}
                            initial={{ 
                              opacity: 0, 
                              y: 40,
                              scale: 0.95,
                              filter: "blur(10px)"
                            }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              scale: 1,
                              filter: "blur(0px)"
                            }}
                            exit={{ 
                              opacity: 0, 
                              y: -40,
                              scale: 0.95,
                              filter: "blur(10px)"
                            }}
                            transition={{ 
                              duration: 0.7,
                              ease: [0.20, 0.67, 0.22, 1.0],
                              delay: index * 0.1
                            }}
                          >
                            <PredictionCard
                              symbol={prediction.market}
                              prediction={prediction.direction.toLowerCase() as "up" | "down"}
                              confidence={prediction.confidence}
                              timestamp={prediction.timestamp}
                              traderText={prediction.analysis || ""}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                    
                    {!isHistoryView && !showCryptoCharts && (
                      <AnimatePresence mode="popLayout">
                        {visibleCards.map((prediction, index) => (
                          <motion.div
                            key={`prediction-${index}-${prediction.market}`}
                            initial={{ 
                              opacity: 0, 
                              y: 40,
                              scale: 0.95,
                              filter: "blur(10px)"
                            }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              scale: 1,
                              filter: "blur(0px)"
                            }}
                            exit={{ 
                              opacity: 0, 
                              y: -40,
                              scale: 0.95,
                              filter: "blur(10px)"
                            }}
                            transition={{ 
                              duration: 0.7,
                              ease: [0.20, 0.67, 0.22, 1.0],
                              delay: index * 0.1
                            }}
                          >
                            <PredictionCard
                              symbol={prediction.market}
                              prediction={prediction.direction.toLowerCase() as "up" | "down"}
                              confidence={prediction.confidence}
                              timestamp={prediction.timestamp}
                              traderText={prediction.analysis}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
