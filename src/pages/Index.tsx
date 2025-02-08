
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Network, Terminal, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PredictionCard from '@/components/PredictionCard';

// Sample market call texts with structured data
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
  const [currentInsight, setCurrentInsight] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ message: string, timestamp: string, isUser?: boolean }>>([]);
  const [currentMarketCall, setCurrentMarketCall] = useState(marketCalls[0]);
  const [userInput, setUserInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Simulate market calls coming in only to MARKET_INTEL
  useEffect(() => {
    const interval = setInterval(() => {
      const randomCall = marketCalls[Math.floor(Math.random() * marketCalls.length)];
      setCurrentMarketCall(randomCall);
    }, 15000); // New market call every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const handleUserMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message to chat
    const timestamp = new Date().toLocaleTimeString();
    setChatHistory(prev => [...prev, { message: userInput, timestamp, isUser: true }]);
    
    // Clear input and scroll to bottom
    setUserInput("");
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = "Acknowledged. Analyzing market patterns and correlating with historical data. Would you like me to run a deeper technical analysis?";
      setChatHistory(prev => [...prev, { message: aiResponse, timestamp: new Date().toLocaleTimeString() }]);
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen overflow-hidden bat-grid">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 h-screen flex flex-col"
      >
        {/* Header */}
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

        {/* Main Grid */}
        <div className="grid grid-cols-2 gap-4 h-[90vh]">
          {/* Left Column - Codec Feed and Command Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Codec Feed */}
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
                        msg.isUser ? 'bg-emerald-500/20' : 'bg-white/5'
                      }`}>
                        <p className="text-sm text-white font-mono whitespace-pre-line">{msg.message}</p>
                        <p className="text-[10px] text-emerald-400/50 mt-1">{msg.timestamp}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Command Interface */}
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

          {/* Right Column - Market Intel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl relative overflow-hidden p-6"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">MARKET_INTEL</h2>
              </div>
              <div className="flex-1 relative">
                <PredictionCard
                  symbol={currentMarketCall.market}
                  prediction={currentMarketCall.direction === "LONG" ? "up" : "down"}
                  confidence={currentMarketCall.confidence}
                  timestamp={new Date().toLocaleTimeString()}
                  traderText={currentMarketCall.analysis}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;

