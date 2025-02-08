import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Network, Terminal, Send, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PredictionCard from '@/components/PredictionCard';
import { useToast } from '@/components/ui/use-toast';

const marketIntelligence = [
  "Blackrock acquires 12,000 BTC in latest strategic move",
  "Ethereum Foundation announces major protocol upgrade",
  "MicroStrategy increases Bitcoin holdings by 8,000 BTC",
  "JP Morgan updates crypto trading desk infrastructure",
  "Major DeFi protocol reports record-breaking TVL"
];

const marketCalls = [
  {
    traderProfile: "Alpha Trader",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "43,250",
    timeframe: "4H",
    analysis: "Strong bullish divergence detected. RSI showing oversold conditions.",
    confidence: 97,
    roi: 875
  },
  {
    traderProfile: "Crypto Whale",
    market: "ETH/USD",
    direction: "LONG",
    entryPrice: "2,450",
    timeframe: "1D",
    analysis: "Breaking key resistance. Volume profile confirms breakout.",
    confidence: 85,
    roi: 650
  },
  {
    traderProfile: "Smart Money",
    market: "LINK/USD",
    direction: "LONG",
    entryPrice: "18.50",
    timeframe: "2H",
    analysis: "Forming cup and handle pattern.",
    confidence: 92,
    roi: 450
  },
  {
    traderProfile: "Market Oracle",
    market: "BTC/USD",
    direction: "SHORT",
    entryPrice: "44,800",
    timeframe: "4H",
    analysis: "Showing bearish divergence on 4H timeframe.",
    confidence: 88,
    roi: -320
  },
  {
    traderProfile: "Trend Hunter",
    market: "SOL/USD",
    direction: "LONG",
    entryPrice: "95.20",
    timeframe: "1H",
    analysis: "Multiple timeframe analysis suggests accumulation phase.",
    confidence: 94,
    roi: 560
  },
];

const Index = () => {
  const { toast } = useToast();
  const [currentInsight, setCurrentInsight] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ message: string, timestamp: string, isUser?: boolean, type?: 'chat' | 'intel' | 'history' }>>([]);
  const [predictions, setPredictions] = useState<Array<any>>([]);
  const [userInput, setUserInput] = useState("");
  const [isHistoryView, setIsHistoryView] = useState(false);
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
      const timestamp = new Date().toLocaleTimeString();
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

    const timestamp = new Date().toLocaleTimeString();
    
    setChatHistory(prev => [...prev, { 
      message: userInput, 
      timestamp, 
      isUser: true, 
      type: 'chat' 
    }]);
    
    if (userInput.toLowerCase().includes('history') || userInput.toLowerCase().includes('previous calls')) {
      setIsHistoryView(true);
      const traderHistory = predictions.slice(0, 10).map(p => ({
        market: p.market,
        direction: p.direction,
        confidence: p.confidence,
        roi: p.roi,
        timestamp: new Date().toLocaleTimeString()
      }));

      setTimeout(() => {
        setChatHistory(prev => [...prev, { 
          message: JSON.stringify(traderHistory, null, 2),
          timestamp: new Date().toLocaleTimeString(),
          type: 'history'
        }]);
        
        toast({
          title: "Trader History Retrieved",
          description: "Displaying last 10 trading calls",
          className: "bg-emerald-500/20 text-white border-emerald-500/20"
        });
        
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 1000);
    } else {
      setIsHistoryView(false);
      setTimeout(() => {
        const aiResponse = "Acknowledged. Analyzing market patterns and correlating with historical data. Would you like me to run a deeper technical analysis?";
        setChatHistory(prev => [...prev, { 
          message: aiResponse, 
          timestamp: new Date().toLocaleTimeString(),
          type: 'chat'
        }]);
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 1000);
    }

    setUserInput("");
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
              <AnimatePresence mode="wait">
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
                      ease: [0.19, 1.0, 0.22, 1.0]
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
                  <div className="flex items-center gap-2 mb-4">
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
                </motion.div>
              </AnimatePresence>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                {predictions.map((prediction, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PredictionCard
                      symbol={prediction.market}
                      prediction={prediction.direction === "LONG" ? "up" : "down"}
                      confidence={prediction.confidence}
                      timestamp={new Date().toLocaleTimeString()}
                      traderText={prediction.analysis}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
