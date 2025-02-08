
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Network, Terminal, Send, History, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PredictionCard from '@/components/PredictionCard';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns-tz';

const marketIntelligence = [
  "Blackrock acquires 12,000 BTC in latest strategic move",
  "Ethereum Foundation announces major protocol upgrade",
  "MicroStrategy increases Bitcoin holdings by 8,000 BTC",
  "JP Morgan updates crypto trading desk infrastructure",
  "Major DeFi protocol reports record-breaking TVL"
];

const marketCalls = [
  {
    traderProfile: "Bitcoin Whale",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "48,250",
    timeframe: "4H",
    analysis: "Accumulation phase complete. Whales increasing positions.",
    confidence: 94,
    roi: 1250,
    timestamp: format(new Date(), 'yyyy-MM-dd HH:mm', { timeZone: 'Asia/Singapore' })
  },
  {
    traderProfile: "ETH Oracle",
    market: "ETH/USD",
    direction: "LONG",
    entryPrice: "2,850",
    timeframe: "1D",
    analysis: "Triple bottom formation with increasing volume.",
    confidence: 92,
    roi: 875,
    timestamp: format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm', { timeZone: 'Asia/Singapore' })
  },
  {
    traderProfile: "Doge Hunter",
    market: "DOGE/USD",
    direction: "LONG",
    entryPrice: "0.085",
    timeframe: "2H",
    analysis: "Social sentiment spike detected. Major influencer activity.",
    confidence: 88,
    roi: 420,
    timestamp: format(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm', { timeZone: 'Asia/Singapore' })
  },
  {
    traderProfile: "TRX Master",
    market: "TRX/USD",
    direction: "SHORT",
    entryPrice: "0.14",
    timeframe: "4H",
    analysis: "Bearish divergence on RSI. Volume declining.",
    confidence: 86,
    roi: 320,
    timestamp: format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm', { timeZone: 'Asia/Singapore' })
  },
  {
    traderProfile: "Bitcoin Scout",
    market: "BTC/USD",
    direction: "SHORT",
    entryPrice: "52,800",
    timeframe: "1D",
    analysis: "Distribution pattern forming at resistance.",
    confidence: 91,
    roi: 680,
    timestamp: format(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm', { timeZone: 'Asia/Singapore' })
  },
  {
    traderProfile: "ETH Tracker",
    market: "ETH/USD",
    direction: "LONG",
    entryPrice: "2,450",
    timeframe: "4H",
    analysis: "Breaking out of falling wedge pattern.",
    confidence: 89,
    roi: 540,
    timestamp: format(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm', { timeZone: 'Asia/Singapore' })
  }
];

const Index = () => {
  const { toast } = useToast();
  const [currentInsight, setCurrentInsight] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ message: string, timestamp: string, isUser?: boolean, type?: 'chat' | 'intel' | 'history' }>>([]);
  const [predictions, setPredictions] = useState<Array<any>>([]);
  const [userInput, setUserInput] = useState("");
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [filteredHistory, setFilteredHistory] = useState<Array<any>>(marketCalls.slice(0, 6).map(call => ({
    market: call.market,
    direction: call.direction,
    confidence: call.confidence,
    roi: call.roi,
    trader: call.traderProfile,
    timestamp: call.timestamp
  })));
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomCall = marketCalls[Math.floor(Math.random() * marketCalls.length)];
      setPredictions(prev => [randomCall, ...prev].slice(0, 100));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIntel = marketIntelligence[Math.floor(Math.random() * marketIntelligence.length)];
      const timestamp = format(new Date(), 'HH:mm:ss', { timeZone: 'Asia/Singapore' });
      setChatHistory(prev => [...prev, { 
        message: randomIntel, 
        timestamp, 
        type: 'intel'
      }]);
      
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const handleUserMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const timestamp = format(new Date(), 'HH:mm:ss', { timeZone: 'Asia/Singapore' });
    
    setChatHistory(prev => [...prev, { 
      message: userInput, 
      timestamp, 
      isUser: true, 
      type: 'chat' 
    }]);
    
    const isHistoryQuery = 
      userInput.toLowerCase().includes('history') || 
      userInput.toLowerCase().includes('calls') || 
      userInput.toLowerCase().includes('show me') ||
      userInput.toLowerCase().includes('previous');

    if (isHistoryQuery) {
      setIsHistoryView(true);
      
      const query = userInput.toLowerCase();
      let filtered = [...marketCalls];

      if (query.includes('btc')) {
        filtered = filtered.filter(p => p.market.toLowerCase().includes('btc'));
      }
      if (query.includes('eth')) {
        filtered = filtered.filter(p => p.market.toLowerCase().includes('eth'));
      }
      if (query.includes('doge')) {
        filtered = filtered.filter(p => p.market.toLowerCase().includes('doge'));
      }
      if (query.includes('trx')) {
        filtered = filtered.filter(p => p.market.toLowerCase().includes('trx'));
      }
      if (query.includes('trader')) {
        const traderName = query.split('trader')[1]?.split(' ')[1];
        if (traderName) {
          filtered = filtered.filter(p => p.traderProfile.toLowerCase().includes(traderName.toLowerCase()));
        }
      }

      setChatHistory(prev => [...prev, { 
        message: "Accessing secure trading records... Decrypting data...",
        timestamp: format(new Date(), 'HH:mm:ss', { timeZone: 'Asia/Singapore' }),
        type: 'chat'
      }]);

      setTimeout(() => {
        const historyData = filtered.slice(0, 6).map(p => ({
          market: p.market,
          direction: p.direction,
          confidence: p.confidence,
          roi: p.roi,
          trader: p.traderProfile,
          timestamp: p.timestamp
        }));

        setFilteredHistory(historyData);
        
        setChatHistory(prev => [...prev, { 
          message: `Secured ${historyData.length} trading records matching your query.`,
          timestamp: format(new Date(), 'HH:mm:ss', { timeZone: 'Asia/Singapore' }),
          type: 'history'
        }]);
        
        toast({
          title: "Trading Records Retrieved",
          description: `Found ${historyData.length} matching trading calls`,
          className: "bg-emerald-500/20 text-white border-emerald-500/20"
        });
      }, 1500);
    } else {
      setIsHistoryView(false);
      setTimeout(() => {
        const aiResponse = "Acknowledged. Analyzing market patterns and correlating with historical data. Would you like me to run a deeper technical analysis?";
        setChatHistory(prev => [...prev, { 
          message: aiResponse, 
          timestamp: format(new Date(), 'HH:mm:ss', { timeZone: 'Asia/Singapore' }),
          type: 'chat'
        }]);
      }, 1000);
    }

    setUserInput("");
    
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

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
              <Shield className="w-6 h-6 text-emerald-400" />
              <h1 className="text-4xl font-bold text-white tracking-wider">
                WAYNE<span className="text-emerald-400">NET</span>
              </h1>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400/70" />
              <p className="text-sm text-emerald-400/70 font-mono tracking-[0.2em]">
                MARKET_SURVEILLANCE_PROTOCOL
              </p>
              <Network className="w-4 h-4 text-emerald-400/70" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 h-[90vh]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="glass-card rounded-2xl overflow-hidden relative p-6 flex-1">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white">CODEC_FEED</h2>
                </div>
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4"
                >
                  {chatHistory.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: msg.isUser ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] glass-card p-3 rounded-xl ${
                        msg.type === 'intel' ? 'bg-purple-500/20 border-purple-500/30' :
                        msg.type === 'history' ? 'bg-blue-500/20 border-blue-500/30' :
                        msg.isUser ? 'bg-emerald-500/20' : 'bg-white/5'
                      }`}>
                        {msg.type === 'intel' && (
                          <div className="flex items-center gap-2 mb-1">
                            <Network className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] text-purple-400 uppercase tracking-wider">Market Intel</span>
                          </div>
                        )}
                        {msg.type === 'history' && (
                          <div className="flex items-center gap-2 mb-1">
                            <History className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] text-blue-400 uppercase tracking-wider">Trading History</span>
                          </div>
                        )}
                        <p className="text-sm text-white font-mono whitespace-pre-line">{msg.message}</p>
                        <p className="text-[10px] text-emerald-400/50 mt-1">{msg.timestamp}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden relative p-6">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
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
                  {(isHistoryView ? filteredHistory : predictions).map((prediction, index) => (
                    <motion.div
                      key={`${isHistoryView ? 'history' : 'intel'}-${index}`}
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
