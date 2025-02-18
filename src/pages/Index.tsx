import React, { useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import CopenetHeader from '@/components/CopenetHeader';
import ChatInterface from '@/components/ChatInterface';
import Leaderboard from '@/components/Leaderboard';
import MarketIntel from '@/components/MarketIntel';
import { useChat } from '@/hooks/useChat';
import { leaderboardData, demoRankChanges, demoROI, marketIntelligence } from '@/data/marketData';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageCircle, Radio, Activity } from 'lucide-react';
import { format } from 'date-fns';

const Index = () => {
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<Array<any>>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: 'rank' | 'roi' | 'score' | null,
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' });

  const {
    chatHistory,
    userInput,
    setUserInput,
    isHistoryView,
    filteredHistory,
    performanceData,
    handleUserMessage,
    handleBackToIntel
  } = useChat();

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

  return (
    <div className="min-h-screen overflow-hidden bat-grid">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 h-screen flex flex-col"
      >
        <CopenetHeader />

        <div className="grid grid-cols-2 gap-4 h-[90vh]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="glass-card rounded-2xl overflow-hidden relative p-6 flex-1 flex flex-col h-full bg-[#0a0b0d]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
              
              <Tabs defaultValue="chat" className="flex-1 flex flex-col">
                <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-black/20 p-1 text-muted-foreground w-fit border border-emerald-500/20">
                  <TabsTrigger value="chat" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="codec" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm">
                    <Radio className="w-4 h-4 mr-2" />
                    CODEC
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm">
                    <Activity className="w-4 h-4 mr-2" />
                    Leaderboard
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 relative mt-0">
                  <ChatInterface
                    messages={chatHistory}
                    userInput={userInput}
                    onInputChange={(value) => setUserInput(value)}
                    onSubmit={handleUserMessage}
                    containerRef={chatContainerRef}
                  />
                </TabsContent>

                <TabsContent value="codec" className="flex-1 relative mt-0">
                  <div className="h-full flex flex-col space-y-4">
                    <div className="flex items-center gap-2 text-purple-400 font-mono text-sm">
                      <Activity className="w-4 h-4" />
                      <span>MARKET INTEL</span>
                    </div>
                    {marketIntelligence.map((intel, index) => (
                      <div key={index} className="bg-black/40 rounded-lg p-4 border border-emerald-500/10">
                        <p className="text-emerald-400 font-mono text-sm">{intel}</p>
                        <p className="text-xs text-emerald-400/50 font-mono mt-2">
                          {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="leaderboard" className="flex-1 relative mt-0">
                  <Leaderboard
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSort={handleSort}
                    sortedAndFilteredLeaderboard={sortedAndFilteredLeaderboard}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          <MarketIntel
            predictions={predictions}
            isHistoryView={isHistoryView}
            filteredHistory={filteredHistory}
            performanceData={performanceData}
            chartRef={chartRef}
            onBackToIntel={handleBackToIntel}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
