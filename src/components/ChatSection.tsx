
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Network, ArrowLeft } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import PerformanceChart from './PerformanceChart';
import PredictionCard from './PredictionCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatSectionProps {
  chatHistory: Array<{
    message: string;
    timestamp: string;
    isUser?: boolean;
    type?: 'chat' | 'intel' | 'history';
    contextData?: {
      showChart?: boolean;
      showCalls?: boolean;
    };
  }>;
  userInput: string;
  onUserInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  showIntel?: boolean;
  isThinking?: boolean;
  onViewChart?: () => void;
}

const MONTHLY_DATA = [
  { month: 'Jan', winRate: 75 },
  { month: 'Feb', winRate: 82 },
  { month: 'Mar', winRate: 68 },
  { month: 'Apr', winRate: 91 },
  { month: 'May', winRate: 84 },
  { month: 'Jun', winRate: 77 }
];

const ChatSection = ({ 
  chatHistory, 
  userInput, 
  onUserInput, 
  onSubmit, 
  containerRef,
  showIntel = false,
  isThinking = false,
  onViewChart
}: ChatSectionProps) => {
  const [showHistoryView, setShowHistoryView] = React.useState(false);
  const [selectedMessage, setSelectedMessage] = React.useState<{
    showChart?: boolean;
    showCalls?: boolean;
  } | null>(null);
  const isMobile = useIsMobile();
  
  const viewChartCalled = React.useRef(false);

  const handleMessageClick = (contextData?: { showChart?: boolean; showCalls?: boolean }) => {
    console.log("Message clicked in ChatSection", contextData);
    
    if (contextData) {
      setSelectedMessage(contextData);
      
      if (isMobile) {
        setShowHistoryView(true);
      }
      
      if (!isMobile && onViewChart && !viewChartCalled.current) {
        console.log("Calling onViewChart from handleMessageClick");
        // When clicking on a message with showCalls, make sure we trigger onViewChart
        onViewChart();
        viewChartCalled.current = true;
        
        setTimeout(() => {
          viewChartCalled.current = false;
        }, 1000);
      }
    }
  };

  React.useEffect(() => {
    if (!isMobile && selectedMessage && onViewChart && !viewChartCalled.current) {
      console.log("Calling onViewChart from useEffect");
      onViewChart();
      viewChartCalled.current = true;
      
      setTimeout(() => {
        viewChartCalled.current = false;
      }, 1000);
    }
  }, [selectedMessage, isMobile, onViewChart]);

  const renderHistoryContent = () => {
    if (!selectedMessage) return null;

    return (
      <div className="space-y-4 w-full">
        {selectedMessage.showChart && (
          <div className="glass-card p-2 sm:p-4 rounded-xl border border-emerald-500/20 w-full">
            <PerformanceChart monthlyData={MONTHLY_DATA} />
          </div>
        )}

        {selectedMessage.showCalls && (
          <div className="space-y-4">
            <PredictionCard
              symbol="BTC/USD"
              prediction="up"
              confidence={85}
              timestamp="2024-03-15 09:30 JST"
              traderText="Strong bullish momentum with high volume"
            />
            <PredictionCard
              symbol="ETH/USD"
              prediction="down"
              confidence={75}
              timestamp="2024-03-15 10:15 JST"
              traderText="Bearish divergence on 4H timeframe"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 flex flex-col h-full">
      {showIntel && (
        <div className="flex items-center gap-2 mb-2">
          <Network className="w-5 h-5 text-[#9b87f5]" />
          <span className="text-[#9b87f5] font-medium tracking-wider text-sm">
            MARKET INTEL
          </span>
          <div className="w-2 h-2 rounded-full bg-[#9b87f5] animate-pulse" />
        </div>
      )}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-2 px-2"
      >
        {chatHistory
          .filter(msg => showIntel ? msg.type === 'intel' : msg.type !== 'intel')
          .map((msg, idx) => (
            <ChatMessage
              key={idx}
              message={msg.message}
              timestamp={msg.timestamp}
              isUser={msg.isUser}
              type={msg.type}
              onMessageClick={() => handleMessageClick(msg.contextData)}
              onViewChart={onViewChart}
            />
          ))}
        {isThinking && <ChatMessage message="" timestamp="" isThinking={true} />}
      </div>
      {!showIntel && (
        <div className="p-2 sm:p-3 bg-black/50 backdrop-blur-sm border-t border-emerald-500/20">
          <ChatInput
            value={userInput}
            onChange={onUserInput}
            onSubmit={onSubmit}
          />
        </div>
      )}

      <AnimatePresence>
        {showHistoryView && isMobile && selectedMessage && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-black/95 overflow-y-auto"
          >
            <div className="p-4 space-y-4">
              <button
                onClick={() => setShowHistoryView(false)}
                className="flex items-center gap-2 text-emerald-400 mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Chat
              </button>

              {renderHistoryContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatSection;
