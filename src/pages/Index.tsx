import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, Network, Send, History, ArrowLeft,
  MessageCircle, Activity, Radio, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Import components
import { AppHeader } from '@/components/AppHeader';
import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/components/ChatMessage';
import PredictionCard from '@/components/PredictionCard';
import TraderCard from '@/components/TraderCard';

// Import data
import { marketIntelligence } from '@/data/marketIntelligence';
import { marketCalls } from '@/data/marketCalls';
import { demoRankChanges, demoROI } from '@/data/demoData';
import { leaderboardData, type TraderData } from '@/data/leaderboardData';

// Import utilities
import { formatJapanTime } from '@/utils/dateUtils';
import { generatePerformanceData } from '@/utils/performanceUtils';

const Index = () => {
  const { toast } = useToast();
  const [currentInsight, setCurrentInsight] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Add new state for search and sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: 'rank' | 'roi' | 'score' | null,
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' });

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

  const scrollToChart = () => {
    if (chartRef.current) {
      chartRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

    const query = userInput.toLowerCase();
    const isWinRateQuery = query.includes('win rate');
    const isCallsQuery = query.includes('calls') || query.includes('trades');
    const isHsakaQuery = query.includes('hsaka');
    const year = '2024';

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

  return (
    <div className="min-h-screen overflow-hidden bat-grid">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 h-screen flex flex-col"
      >
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
                  <TabsList className="bg-black/20 border border-emerald-500/20">
                    <TabsTrigger 
                      value="chat"
                      className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger 
                      value="codec"
                      className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                    >
                      <Radio className="w-4 h-4 mr-2" />
                      CODEC
                    </TabsTrigger>
                    <TabsTrigger 
                      value="leaderboard"
                      className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Leaderboard
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="chat" className="flex-1 relative mt-0">
                  <div className="absolute inset-0 flex flex-col">
                    <div 
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20"
                    >
                      {chatHistory.filter(msg => msg.type !== 'intel').map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: msg.isUser ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] glass-card p-3 rounded-xl ${
                            msg.type === 'history' ? 'bg-blue-500/20 border-blue-500/30' :
                            msg.isUser ? 'bg-emerald-500/20' : 'bg-white/5'
                          }`}>
                            {msg.type === 'history' && (
                              <div className="flex items-center gap-2 mb-1">
                                <History className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] text-blue-400 uppercase tracking-wider">Trading History</span>
                              </div>
                            )}
                            <p 
                              className="text-sm text-white font-mono whitespace-pre-line"
                              dangerouslySetInnerHTML={{ __html: msg.message }}
                            />
                            <p className="text-[10px] text-emerald-400/50 mt-1">{msg.timestamp}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-sm border-t border-emerald-500/20">
                      <form onSubmit={handleUserMessage} className="relative">
                        <Input
                          type="text"
                          placeholder="Enter command, Master Wayne..."
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          className="w-full bg-white/5 border-emerald-500/20 text-white placeholder:text-emerald-500/50"
                        />
                        <button
                          type="submit"
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="codec" className="flex-1 relative mt-0">
                  <div className="absolute inset-0">
                    <div className="h-full overflow-y-auto custom-scrollbar space-y-4">
                      {chatHistory.filter(msg => msg.type === 'intel').map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="glass-card p-3 rounded-xl bg-purple-500/20 border-purple-500/30"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Network className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] text-purple-400 uppercase tracking-wider">Market Intel</span>
                          </div>
                          <p className="text-sm text-white font-mono">{msg.message}</p>
                          <p className="text-[10px] text-emerald-400/50 mt-1">{msg.timestamp}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="leaderboard" className="flex-1 relative mt-0">
                  <div className="absolute inset-0">
                    <div className="h-full overflow-y-auto custom-scrollbar space-y-4 pb-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 space-y-4"
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <h2 className="text-lg font-bold text-white">Top Traders</h2>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/50" />
                            <Input
                              type="text"
                              placeholder="Search traders..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-black/20 border-emerald-500/20 text-white placeholder:text-emerald-500/50 pl-8"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400/50 text-xs font-mono">
                              {sortedAndFilteredLeaderboard.length} traders
                            </div>
                          </div>

                          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('rank')}
                              className={cn(
                                "text-xs font-mono whitespace-nowrap",
                                sortConfig.key === 'rank' && "bg-emerald-500/10 text-emerald-400"
                              )}
                            >
                              Rank Change {sortConfig.key === 'rank' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('roi')}
                              className={cn(
                                "text-xs font-mono whitespace-nowrap",
                                sortConfig.key === 'roi' && "bg-emerald-500/10 text-emerald-400"
                              )}
                            >
                              ROI {sortConfig.key === 'roi' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort('score')}
                              className={cn(
                                "text-xs font-mono whitespace-nowrap",
                                sortConfig.key === 'score' && "bg-emerald-500/10 text-emerald-400"
                              )}
                            >
                              Score {sortConfig.key === 'score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </Button>
                          </div>
                        </div>

                        <div className="h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
                      </motion.div>
                      
                      {sortedAndFilteredLeaderboard.map((trader, index) => (
                        <motion.div
                          key={trader.trader}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <TraderCard
                            trader={trader.trader}
                            score={trader.score}
                            status={trader.status}
                            position={index + 1}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
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
                      <div className="h-[300px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performanceData.monthlyData}>
                            <XAxis 
                              dataKey="month" 
                              stroke="#10B981"
                              tick={{ fill: '#10B981', fontSize: 12 }}
                            />
                            <YAxis 
                              stroke="#10B981"
                              tick={{ fill: '#10B981', fontSize: 12 }}
                              domain={[0, 100]}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid rgba(16,185,129,0.2)',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar
                              dataKey="winRate"
                              fill="#10B981"
                              opacity={0.8}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center text-emerald-400 font-mono">
                        Monthly Win Rate Analysis
                      </div>
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
