
import React from 'react';
import { Send, MessageCircle } from 'lucide-react';
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
  return (
    <div className="glass-card rounded-2xl overflow-hidden relative p-6 flex-1 flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex",
              msg.isUser ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] glass-card p-3 rounded-xl",
                msg.type === 'history' ? 'bg-blue-500/20 border-blue-500/30' :
                msg.isUser ? 'bg-emerald-500/20' : 'bg-white/5'
              )}
            >
              <p
                className="text-sm text-white font-mono whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: msg.message }}
              />
              <p className="text-[10px] text-emerald-400/50 mt-1">{msg.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-sm border-t border-emerald-500/20">
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter command, Master Wayne..."
            value={userInput}
            onChange={(e) => onInputChange(e.target.value)}
            className="w-full bg-white/5 border-emerald-500/20 text-white placeholder:text-emerald-500/50 pr-10"
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
