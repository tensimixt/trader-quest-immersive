
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eye, History } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isUser?: boolean;
  isThinking?: boolean;
  type?: 'chat' | 'intel' | 'history';
  onViewChart?: () => void;
}

const ChatMessage = ({
  message,
  timestamp,
  isUser,
  isThinking,
  type,
  onViewChart
}: ChatMessageProps) => {
  if (isThinking) {
    return (
      <div className="flex justify-start">
        <div className="bg-black/40 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-.3s]" />
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-.5s]" />
          </div>
        </div>
      </div>
    );
  }

  const renderMessage = () => {
    if (message.includes("Click here to view")) {
      const [beforeClick, afterClick] = message.split("Click here");
      return (
        <>
          {beforeClick}
          <Button 
            variant="link" 
            className="text-emerald-400 p-0 h-auto font-mono hover:text-emerald-300"
            onClick={onViewChart}
          >
            Click here
          </Button>
          {afterClick}
        </>
      );
    }
    return message;
  };

  return (
    <div className={cn("flex", isUser ? "justify-start" : "justify-start")}>
      <div className="bg-black/40 p-3 rounded-lg max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          {type === 'history' && <History className="w-4 h-4 text-blue-400" />}
          {type === 'intel' && <Eye className="w-4 h-4 text-emerald-400" />}
        </div>
        <p className={cn(
          "text-sm font-mono",
          isUser ? "text-emerald-400" : "text-white"
        )}>
          {renderMessage()}
        </p>
        <p className="text-[10px] text-emerald-400/50 mt-1">{timestamp}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
