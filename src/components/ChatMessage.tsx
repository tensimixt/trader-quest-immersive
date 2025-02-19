
import React from 'react';
import { motion } from 'framer-motion';
import { History, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isUser?: boolean;
  type?: 'chat' | 'intel' | 'history';
  isThinking?: boolean;
  contextData?: {
    showChart?: boolean;
    showCalls?: boolean;
  };
}

export const ChatMessage = ({ message, timestamp, isUser, type, isThinking, contextData }: ChatMessageProps) => {
  if (isThinking) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-start"
      >
        <div className="max-w-[80%] p-3 rounded-xl bg-black/20">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-emerald-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-emerald-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const isHistory = type === 'history';
  const historyColor = 'text-blue-400';
  const normalColor = isUser ? 'text-emerald-400' : 'text-emerald-400';
  const textColor = isHistory ? historyColor : normalColor;

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] ${isUser ? '' : 'bg-black/20'} rounded-xl p-3`}>
        {type === 'history' && (
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400 uppercase tracking-wider font-mono">TRADING HISTORY</span>
          </div>
        )}
        <div className="space-y-1">
          <p 
            className={`text-sm font-mono ${textColor}`}
            dangerouslySetInnerHTML={{ __html: message }}
          />
          <p className="text-[10px] text-emerald-400/50 font-mono">{timestamp}</p>
        </div>
      </div>
    </motion.div>
  );
};
