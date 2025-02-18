
import React from 'react';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isUser?: boolean;
  type?: 'chat' | 'intel' | 'history';
}

export const ChatMessage = ({ message, timestamp, isUser, type }: ChatMessageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
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
        <p 
          className="text-sm text-white font-mono whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <p className="text-[10px] text-emerald-400/50 mt-1">{timestamp}</p>
      </div>
    </motion.div>
  );
};
