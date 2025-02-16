
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, BarChart3, LayoutDashboard, Rocket, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import LeaderboardTab from '@/components/LeaderboardTab';
import { formatDistanceToNow } from 'date-fns';

type Message = {
  text: string;
  timestamp: Date;
  isUser: boolean;
};

const Index = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'marketIntel'>('leaderboard');

  useEffect(() => {
    setMessages([
      {
        text: "Hey! I'm CHAT_GPT, your AI trading assistant. Ask me anything about market analysis, trading strategies, or even predict future trends!",
        timestamp: new Date(),
        isUser: false
      }
    ]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      text: input.trim(),
      timestamp: new Date(),
      isUser: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInput("");

    setTimeout(() => {
      const aiResponse: Message = {
        text: "Analyzing market data... Please wait.",
        timestamp: new Date(),
        isUser: false
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="min-h-screen overflow-hidden bat-grid">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 h-screen flex flex-col"
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
            AI Trading Platform
          </h1>
          <p className="text-neutral-400 tracking-wide">
            Get real-time market insights and trade with confidence.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 h-[90vh]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="flex-1 glass-card rounded-2xl relative overflow-hidden p-6">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
              
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-white/5">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">CHAT_GPT</h2>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 pb-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`max-w-[80%] p-3 rounded-xl ${message.isUser ? 'ml-auto bg-emerald-500/20 text-white' : 'bg-white/5 text-neutral-200'}`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        {formatDistanceToNow(message.timestamp)} ago
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/95 to-transparent pt-8">
                  <form onSubmit={handleSubmit} className="relative">
                    <Input
                      type="text"
                      placeholder="Ask anything..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full bg-white/5 border-emerald-500/20 text-white placeholder:text-emerald-500/50 shadow-lg"
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
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-start gap-4 w-full"
            >
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'leaderboard' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-neutral-400 hover:text-white'}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Leaderboard</span>
              </button>
              <button
                onClick={() => setActiveTab('marketIntel')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'marketIntel' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-neutral-400 hover:text-white'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Market Intel</span>
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            {activeTab === 'leaderboard' ? (
              <LeaderboardTab />
            ) : (
              <div className="glass-card rounded-2xl p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Rocket className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Market Intel</h2>
                </div>
                <p className="text-neutral-400">
                  Real-time market analysis and insights.
                </p>
                <div className="mt-4 flex-1 flex flex-col items-center justify-center">
                  <Flame className="w-12 h-12 text-red-500 animate-pulse" />
                  <p className="text-sm text-neutral-500 mt-2">
                    Coming Soon...
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
