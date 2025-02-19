
import React from 'react';
import { MessageCircle, Network, History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isUser?: boolean;
  type?: 'chat' | 'intel' | 'history';
  isThinking?: boolean;
  onViewChart?: () => void;
}

const ChatMessage = ({ 
  message, 
  timestamp, 
  isUser = false,
  type = 'chat',
  isThinking = false,
  onViewChart
}: ChatMessageProps) => {
  if (isThinking) {
    return (
      <div className="flex items-start gap-3 text-white/70">
        <div className="w-8 h-8 rounded-lg bg-black/20 border border-white/5 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-white/5 animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-white/5 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-3",
      isUser ? "text-emerald-400" : "text-white/70"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-lg bg-black/20 border border-white/5 flex items-center justify-center",
        isUser && "bg-emerald-500/10 border-emerald-500/20"
      )}>
        {type === 'intel' && <Network className="w-4 h-4" />}
        {type === 'history' && <History className="w-4 h-4" />}
        {type === 'chat' && <MessageCircle className="w-4 h-4" />}
      </div>
      <div className="flex-1 space-y-1">
        <div 
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <span className="text-xs text-white/30">{timestamp}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
