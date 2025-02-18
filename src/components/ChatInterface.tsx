
import React from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  messages: Array<{
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
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const ChatInterface = ({
  messages,
  userInput,
  onInputChange,
  onSubmit,
  containerRef
}: ChatInterfaceProps) => {
  // Filter out codec messages from the chat view
  const chatMessages = messages.filter(msg => msg.type !== 'intel');
  
  return (
    <div className="h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20"
      >
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex",
              msg.isUser ? "justify-start" : "justify-start"
            )}
          >
            <div className="bg-black/40 p-3 rounded-lg max-w-[80%]">
              <p className={cn(
                "text-sm font-mono",
                msg.isUser ? "text-emerald-400" : "text-white"
              )}>
                {msg.message}
              </p>
              <p className="text-[10px] text-emerald-400/50 mt-1">{msg.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="absolute bottom-0 left-0 right-0 p-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter command, Master Wayne..."
            value={userInput}
            onChange={(e) => onInputChange(e.target.value)}
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
    </div>
  );
};

export default ChatInterface;
