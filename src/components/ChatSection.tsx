
import React from 'react';
import { motion } from 'framer-motion';
import { Network } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

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
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsHistoryView: (value: boolean) => void;
  isHistoryView: boolean;
}

const ChatSection = ({ 
  chatHistory, 
  userInput, 
  onUserInput, 
  onSubmit, 
  containerRef,
  showIntel = false,
  isThinking = false,
  onViewChart,
  activeTab,
  setActiveTab,
  setIsHistoryView,
  isHistoryView
}: ChatSectionProps) => {
  const handleBackToChat = () => {
    setIsHistoryView(false);
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      {showIntel && (
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-[#9b87f5]" />
          <span className="text-[#9b87f5] font-medium tracking-wider text-sm">
            MARKET INTEL
          </span>
          <div className="w-2 h-2 rounded-full bg-[#9b87f5] animate-pulse" />
        </div>
      )}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20 px-2"
      >
        {chatHistory
          .filter(msg => showIntel ? msg.type === 'intel' : msg.type !== 'intel')
          .map((msg, idx) => {
            const isLastMessage = idx === chatHistory.length - 1;
            return (
              <ChatMessage
                key={idx}
                message={msg.message}
                timestamp={msg.timestamp}
                isUser={msg.isUser}
                type={isHistoryView && isLastMessage ? 'history' : msg.type}
                onViewChart={onViewChart}
                showBackButton={isHistoryView && isLastMessage}
                onBackToChat={handleBackToChat}
              />
            );
          })}
        {isThinking && <ChatMessage message="" timestamp="" isThinking={true} />}
      </div>
      {!showIntel && !isHistoryView && (
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-black/50 backdrop-blur-sm border-t border-emerald-500/20">
          <ChatInput
            value={userInput}
            onChange={onUserInput}
            onSubmit={onSubmit}
          />
        </div>
      )}
    </div>
  );
};

export default ChatSection;
