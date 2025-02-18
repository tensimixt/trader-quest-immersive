<lov-code>
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, Network, Terminal, Send, History, ArrowLeft,
  MessageCircle, Activity, Radio, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PredictionCard from '@/components/PredictionCard';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns-tz';
import { useToast } from '@/hooks/use-toast';
import TraderCard from '@/components/TraderCard';
import { cn } from '@/lib/utils';

const marketIntelligence = [
  "Blackrock acquires 12,000 BTC in latest strategic move",
  "Ethereum Foundation announces major protocol upgrade",
  "MicroStrategy increases Bitcoin holdings by 8,000 BTC",
  "JP Morgan updates crypto trading desk infrastructure",
  "Major DeFi protocol reports record-breaking TVL"
];

const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

const marketCalls = [
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "48,250",
    timeframe: "4H",
    analysis: "Double bottom pattern with volume.",
    confidence: 94,
    roi: 1250,
    timestamp: formatJapanTime(new Date('2024-01-15'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "LONG",
    entryPrice: "2,850",
    timeframe: "1D",
    analysis: "Breaking resistance.",
    confidence: 92,
    roi: -275,
    timestamp: formatJapanTime(new Date('2024-01-15'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "SHORT",
    entryPrice: "52,100",
    timeframe: "4H",
    analysis: "RSI divergence.",
    confidence: 88,
    roi: 820,
    timestamp: formatJapanTime(new Date('2024-02-08'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "LONG",
    entryPrice: "98.5",
    timeframe: "1D",
    analysis: "Accumulation phase complete, ready for breakout.",
    confidence: 91,
    roi: 1100,
    timestamp: formatJapanTime(new Date('2024-02-07'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "55,300",
    timeframe: "4H",
    analysis: "Bull flag formation on high timeframe.",
    confidence: 89,
    roi: 750,
    timestamp: formatJapanTime(new Date('2024-03-12'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "SHORT",
    entryPrice: "3,150",
    timeframe: "1D",
    analysis: "Head and shoulders pattern forming.",
    confidence: 87,
    roi: -320,
    timestamp: formatJapanTime(new Date('2024-03-20'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "57,800",
    timeframe: "4H",
    analysis: "Golden cross on daily timeframe.",
    confidence: 93,
    roi: 1500,
    timestamp: formatJapanTime(new Date('2024-04-05'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "SHORT",
    entryPrice: "125.5",
    timeframe: "1D",
    analysis: "Bearish divergence on RSI.",
    confidence: 86,
    roi: 650,
    timestamp: formatJapanTime(new Date('2024-04-18'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "59,200",
    timeframe: "4H",
    analysis: "Support level bounce with volume.",
    confidence: 90,
    roi: 880,
    timestamp: formatJapanTime(new Date('2024-05-03'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "LONG",
    entryPrice: "3,450",
    timeframe: "1D",
    analysis: "Breaking out of consolidation.",
    confidence: 91,
    roi: -420,
    timestamp: formatJapanTime(new Date('2024-05-22'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "SHORT",
    entryPrice: "62,400",
    timeframe: "4H",
    analysis: "Distribution pattern at resistance.",
    confidence: 88,
    roi: 920,
    timestamp: formatJapanTime(new Date('2024-06-08'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "LONG",
    entryPrice: "145.5",
    timeframe: "1D",
    analysis: "Bullish engulfing pattern.",
    confidence: 92,
    roi: 1350,
    timestamp: formatJapanTime(new Date('2024-06-25'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "63,800",
    timeframe: "4H",
    analysis: "Higher low pattern forming.",
    confidence: 89,
    roi: 780,
    timestamp: formatJapanTime(new Date('2024-07-10'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "SHORT",
    entryPrice: "3,850",
    timeframe: "1D",
    analysis: "Double top formation.",
    confidence: 87,
    roi: -280,
    timestamp: formatJapanTime(new Date('2024-07-28'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "65,200",
    timeframe: "4H",
    analysis: "Ascending triangle breakout.",
    confidence: 93,
    roi: 1150,
    timestamp: formatJapanTime(new Date('2024-08-05'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "SHORT",
    entryPrice: "168.5",
    timeframe: "1D",
    analysis: "Overbought RSI conditions.",
    confidence: 85,
    roi: 720,
    timestamp: formatJapanTime(new Date('2024-08-22'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "67,500",
    timeframe: "4H",
    analysis: "Breaking previous ATH.",
    confidence: 94,
    roi: 1680,
    timestamp: formatJapanTime(new Date('2024-09-08'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "LONG",
    entryPrice: "4,150",
    timeframe: "1D",
    analysis: "Cup and handle formation.",
    confidence: 91,
    roi: -350,
    timestamp: formatJapanTime(new Date('2024-09-25'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "SHORT",
    entryPrice: "71,200",
    timeframe: "4H",
    analysis: "Bearish divergence multiple timeframes.",
    confidence: 88,
    roi: 980,
    timestamp: formatJapanTime(new Date('2024-10-12'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "LONG",
    entryPrice: "182.5",
    timeframe: "1D",
    analysis: "Breaking resistance with volume.",
    confidence: 90,
    roi: 1250,
    timestamp: formatJapanTime(new Date('2024-10-28'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "69,800",
    timeframe: "4H",
    analysis: "Higher low higher high pattern.",
    confidence: 92,
    roi: 850,
    timestamp: formatJapanTime(new Date('2024-11-05'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "SHORT",
    entryPrice: "4,450",
    timeframe: "1D",
    analysis: "Triple top pattern.",
    confidence: 86,
    roi: -420,
    timestamp: formatJapanTime(new Date('2024-11-22'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "72,500",
    timeframe: "4H",
    analysis: "Bull flag breakout.",
    confidence: 93,
    roi: 1450,
    timestamp: formatJapanTime(new Date('2024-12-08'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "LONG",
    entryPrice: "195.5",
    timeframe: "1D",
    analysis: "Accumulation complete.",
    confidence: 91,
    roi: 1180,
    timestamp: formatJapanTime(new Date('2024-12-24'))
  }
];

const demoRankChanges = [
  2, -1, 3, 0, -2, 1, 4, -3, 0, 2,
  -4, 1, -2, 3, 0, 2, -1, 5, -2, 1,
  0, 3, -2, 1, -3
];

const demoROI = [
  8.42, -3.21, 12.54, 5.67, -2.18, 15.32, 7.89, -4.56, 9.23, 3.45,
  -1.98, 6.78, 11.23, -5.43, 4.56, 8.90, -2.34, 13.45, 6.78, -3.21
];

const leaderboardData = [
  {
    trader: "Hsaka",
    score: 158420,
    status: {
      action: "BUY" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T12:00:00')
    }
  },
  {
    trader: "CryptoKage",
    score: 142850,
    status: {
      action: "SELL" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T11:30:00')
    }
  },
  {
    trader: "DefiWhale",
    score: 136700,
    status: {
      action: "BUY" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T10:45:00')
    }
  },
  {
    trader: "AlphaHunter",
    score: 128900,
    status: {
      action: "SELL" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T09:15:00')
    }
  },
  {
    trader: "SatsStack",
    score: 115600,
    status: {
      action: "BUY" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T08:30:00')
    }
  },
  {
    trader: "CryptoNinja",
    score: 98750,
    status: {
      action: "BUY" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T08:15:00')
    }
  },
  {
    trader: "BlockWizard",
    score: 92340,
    status: {
      action: "SELL" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T08:00:00')
    }
  },
  {
    trader: "TradeQueen",
    score: 88900,
    status: {
      action: "BUY" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T07:45:00')
    }
  },
  {
    trader: "CoinMaster",
    score: 84500,
    status: {
      action: "SELL" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T07:30:00')
    }
  },
  {
    trader: "BitLord",
    score: 79200,
    status: {
      action: "BUY" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T07:15:00')
    }
  },
  {
    trader: "CryptoSamurai",
    score: 75800,
    status: {
      action: "SELL" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T07:00:00')
    }
  },
  {
    trader: "ChainMaster",
    score: 71400,
    status: {
      action: "BUY" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T06:45:00')
    }
  },
  {
    trader: "TradingPro",
    score: 68900,
    status: {
      action: "SELL" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T06:30:00')
    }
  },
  {
    trader: "WhaleMaster",
    score: 65300,
    status: {
      action: "BUY" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T06:15:00')
    }
  },
  {
    trader: "CryptoKing",
    score: 61800,
    status: {
      action: "SELL" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T06:00:00')
    }
  },
  {
    trader: "TokenMage",
    score: 58200,
    status: {
      action: "BUY" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T05:45:00')
    }
  },
  {
    trader: "ChartWizard",
    score: 54700,
    status: {
      action: "SELL" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T05:30:00')
    }
  },
  {
    trader: "CryptoShark",
    score: 51200,
    status: {
      action: "BUY" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T05:15:00')
    }
  },
  {
    trader: "BlockSmith",
    score: 48600,
    status: {
      action: "SELL" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T05:00:00')
    }
  },
  {
    trader: "CoinSage",
    score: 45100,
    status: {
      action: "BUY" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T04:45:00')
    }
  },
  {
    trader: "TradeOracle",
    score: 42500,
    status: {
      action: "SELL" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T04:30:00')
    }
  },
  {
    trader: "BitWizard",
    score: 39800,
    status: {
      action: "BUY" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T04:15:00')
    }
  },
  {
    trader: "CryptoMystic",
    score: 37200,
    status: {
      action: "SELL" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T04:00:00')
    }
  },
  {
    trader: "ChainSage",
    score: 34600,
    status: {
      action: "BUY" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T03:45:00')
    }
  },
  {
    trader: "TokenKnight",
    score: 32000,
    status: {
      action: "SELL" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T03:30:00')
    }
  }
];

const generatePerformanceData = (calls: any[], year: string) => {
  const targetWinRates = {
    '01': 75,
    '02': 65,
    '03': 45,
    '04': 85,
    '05': 55,
    '06': 65,
    '07': 85,
    '08': 95,
    '09': 55,
    '10': 75,
    '11': 85,
    '12': 65
  };

  const monthlyData = Object.entries(targetWinRates).map(([month, winRate]) => ({
    month: `${month}`,
    winRate,
    calls: Math.floor(Math.random() * 10) + 5
  }));

  const totalCalls = monthlyData.reduce((acc, curr) => acc + curr.calls, 0);
  const weightedWinRate = monthlyData.reduce((acc, curr) => acc + (curr.winRate * curr.calls), 0) / totalCalls;

  return {
    overall: weightedWinRate.toFixed(2),
    monthlyData
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
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center relative h-[10vh] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 blur-xl" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="relative w-8 h-8">
                <motion.div
                  className="absolute inset-0 border-2 border-emerald-400 rounded-full"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-[4px] border-2 border-emerald-400/80 rounded-full"
                  animate={{ scale: [1.1, 1, 1.1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                />
                <div className="absolute inset-[8px] flex items-center justify-center">
                  <motion.div
                    className="w-1 h-1 bg-emerald-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="w-1 h-1
