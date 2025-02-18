import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Send, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PredictionCard from '@/components/PredictionCard';
import { useToast } from '@/hooks/use-toast';
import TraderCard from '@/components/TraderCard';
import MarketHeader from '@/components/MarketHeader';
import TraderSearch from '@/components/TraderSearch';
import { 
  marketIntelligence, marketCalls, demoRankChanges, 
  demoROI, leaderboardData, formatJapanTime 
} from '@/constants/marketData';
import { format } from 'date-fns-tz';

const generatePerformanceData = (calls: any[], year: string) => {
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: format(new Date(parseInt(year), i), 'MMM'),
    winRate: Math.floor(Math.random() * 30) + 70
  }));
  
  return {
    monthlyData,
    overall: Math.floor(monthlyData.reduce((acc, month) => acc + month.winRate, 0) / 12)
  };
};

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
          return sortConfig.direction === 'asc' ? bChange - aChange : aChange - bChange;
        }
        if (sortConfig.key === 'roi') {
          const aROI = demoROI[leaderboardData.indexOf(a) % demoROI.length];
          const bROI = demoROI[leaderboardData.indexOf(b) % demoROI.length];
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
        <MarketHeader />
        
        <div className="grid grid-cols-2 gap-4 h-[90vh]">
          <div className="flex flex-col gap-4">
            <TraderSearch 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {sortedAndFilteredLeaderboard.map((trader, index) => (
                <TraderCard
                  key={trader.trader}
                  trader={trader.trader}
                  score={trader.score}
                  status={trader.status}
                  position={index + 1}
                  rankChange={demoRankChanges[index % demoRankChanges.length]}
                />
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-6 h-6" />
                <Input 
                  placeholder="Ask a question"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleUserMessage}
                />
              </div>
              <div className="flex items-center gap-2">
                <History className="w-6 h-6" />
                <Button onClick={() => setIsHistoryView(true)}>History</Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {chatHistory.map((msg, index) => (
                <div key={index} className="flex items-center gap-2">
                  {msg.isUser ? (
                    <div className="bg-emerald-500 rounded-lg px-2 py-1 text-white">
                      {msg.message}
                    </div>
                  ) : (
                    <div className="bg-gray-200 rounded-lg px-2 py-1">
                      {msg.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
