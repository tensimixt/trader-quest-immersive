
import { useState } from 'react';
import { formatJapanTime } from '../utils/marketUtils';
import { generatePerformanceData } from '../utils/marketUtils';
import { useToast } from './use-toast';
import { marketCalls } from '../data/marketData';

interface ChatMessage {
  message: string;
  timestamp: string;
  isUser?: boolean;
  type?: 'chat' | 'intel' | 'history';
  contextData?: {
    showChart?: boolean;
    showCalls?: boolean;
  };
}

export const useChat = () => {
  const { toast } = useToast();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [filteredHistory, setFilteredHistory] = useState<Array<any>>(marketCalls.slice(0, 6));
  const [performanceData, setPerformanceData] = useState<any>(null);

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

  const handleBackToIntel = () => {
    setIsHistoryView(false);
    setPerformanceData(null);
    setFilteredHistory(marketCalls.slice(0, 6));
  };

  return {
    chatHistory,
    setChatHistory,
    userInput,
    setUserInput,
    isHistoryView,
    setIsHistoryView,
    filteredHistory,
    setFilteredHistory,
    performanceData,
    setPerformanceData,
    handleUserMessage,
    handleBackToIntel
  };
};
