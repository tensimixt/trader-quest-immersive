
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CircleUserRound, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TraderCardProps {
  trader: string;
  score: number;
  status: {
    action: 'BUY' | 'SELL';
    pair: string;
    timestamp: Date;
  };
  position: number;
}

const TraderCard = ({ trader, score, status, position }: TraderCardProps) => {
  const isPositive = status.action === 'BUY';
  
  return (
    <div className="glass-card p-4 rounded-xl mb-3 hover:bg-white/5 transition-all duration-300 group">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-sm group-hover:blur-md transition-all duration-300" />
          <div className="relative">
            <CircleUserRound className="w-12 h-12 text-white/80" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-emerald-400">
              {position}
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{trader}</h3>
            <span className="text-2xl font-mono text-emerald-400">{score.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={cn(
              "text-sm font-mono",
              isPositive ? "text-emerald-400" : "text-red-400"
            )}>
              {status.action} {status.pair}
            </span>
            <span className="text-xs text-white/50">
              {formatDistanceToNow(status.timestamp, { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraderCard;
