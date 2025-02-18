
import React from 'react';
import { Send, ArrowLeft, History } from 'lucide-react';
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
    <div className="h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex",
              msg.isUser ? "justify-start" : "justify-start"
            )}
          >
            {msg.isUser ? (
              <div className="bg-black/40 p-3 rounded-lg max-w-[80%]">
                <p className="text-sm text-emerald-400 font-mono">{msg.message}</p>
                <p className="text-[10px] text-emerald-400/50 mt-1">{msg.timestamp}</p>
              </div>
            ) : msg.type === 'history' ? (
              <div className="bg-black/40 p-3 rounded-lg max-w-[80%]">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono text-blue-400">TRADING HISTORY</span>
                </div>
                <p 
                  className="text-sm text-white font-mono"
                  dangerouslySetInnerHTML={{ 
                    __html: msg.message.replace(
                      'Click here',
                      '<span class="text-emerald-400 cursor-pointer hover:underline">Click here</span>'
                    )
                  }}
                />
                <p className="text-[10px] text-emerald-400/50 mt-1">{msg.timestamp}</p>
              </div>
            ) : (
              <div className="bg-black/40 p-3 rounded-lg max-w-[80%]">
                <p className="text-sm text-white font-mono">{msg.message}</p>
                <p className="text-[10px] text-emerald-400/50 mt-1">{msg.timestamp}</p>
              </div>
            )}
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
