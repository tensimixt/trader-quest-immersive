
import React from 'react';
import { Send } from 'lucide-react';
import ChatMessage from './ChatMessage';

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
            onViewChart={onViewChart}
            isThinking={false}
          />
        ))}
        {isThinking && <ChatMessage message="" timestamp="" isThinking={true} />}
      </div>
      <form onSubmit={onSubmit} className="absolute bottom-0 inset-x-0 bg-black/40 p-4">
        <div className="relative">
          <input
            type="text"
            value={userInput}
            onChange={(e) => onUserInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full rounded-full py-2 px-4 bg-black/60 border border-emerald-500/20 text-white placeholder-emerald-400 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full p-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatSection;
