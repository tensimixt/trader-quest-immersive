
import React from 'react';
import { motion } from 'framer-motion';
import { History, Bot, Network, MessageCircle, ArrowLeft } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isUser?: boolean;
  type?: 'chat' | 'intel' | 'history';
  isThinking?: boolean;
  onViewChart?: () => void;
  showBackButton?: boolean;
  onBackToChat?: () => void;
}

export const ChatMessage = ({ 
  message, 
  timestamp, 
  isUser, 
  type, 
  isThinking, 
  onViewChart,
  showBackButton,
  onBackToChat 
}: ChatMessageProps) => {
  if (isThinking) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-start"
      >
        <div className="max-w-[80%] glass-card p-3 rounded-xl bg-white/5">
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

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      {showBackButton && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBackToChat}
          className="flex items-center gap-2 mb-4 text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chat</span>
        </motion.button>
      )}
      <div className={`max-w-[80%] glass-card p-3 rounded-xl ${
        type === 'history' ? 'bg-blue-500/20 border-blue-500/30' :
        isUser ? 'bg-emerald-500/20' : 'bg-white/5'
      }`}>
        {type === 'history' && (
          <div className="flex items-center gap-2 mb-1">
            <History className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] text-blue-400 uppercase tracking-wider">Trading History</span>
          </div>
        )}
        <div 
          className="text-sm text-white font-mono whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: message }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.text-emerald-400')) {
              e.preventDefault();
              onViewChart?.();
            }
          }}
        />
        <p className="text-[10px] text-emerald-400/50 mt-1">{timestamp}</p>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
