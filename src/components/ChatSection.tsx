
import React from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';

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
  // Filter messages based on type
  const filteredMessages = chatHistory.filter(msg => 
    showIntel ? msg.type === 'intel' : msg.type !== 'intel'
  );

  return (
    <div className="absolute inset-0 flex flex-col">
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20"
      >
        {filteredMessages.map((msg, idx) => (
          <ChatMessage
            key={idx}
            message={msg.message}
            timestamp={msg.timestamp}
            isUser={msg.isUser}
            type={msg.type}
          />
        ))}
        {isThinking && <ChatMessage message="" timestamp="" isThinking={true} />}
      </div>
      {!showIntel && (
        <form onSubmit={onSubmit} className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-sm border-t border-emerald-500/20">
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter command, Master Wayne..."
              value={userInput}
              onChange={(e) => onUserInput(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 text-emerald-400 placeholder:text-emerald-500/50 pr-10 font-mono"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatSection;
