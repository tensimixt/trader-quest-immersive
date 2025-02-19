
import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Network, History } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

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
}

const ChatSection = ({ 
  chatHistory, 
  userInput, 
  onUserInput, 
  onSubmit, 
  containerRef,
  showIntel = false,
  isThinking = false
}: ChatSectionProps) => {
  return (
    <div className="absolute inset-0 flex flex-col">
      {showIntel && (
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 font-mono tracking-wider text-sm">
            MARKET_INTELLIGENCE_MATRIX
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20"
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
              contextData={msg.contextData}
            />
          ))}
        {isThinking && <ChatMessage message="" timestamp="" isThinking={true} />}
      </div>
      {!showIntel && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-sm">
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
