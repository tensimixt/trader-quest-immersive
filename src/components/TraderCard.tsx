
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

const getRankColor = (position: number) => {
  switch (position) {
    case 1:
      return "from-[#FFD700]/20 to-[#FFD700]/40"; // Gold
    case 2:
      return "from-[#C0C0C0]/20 to-[#C0C0C0]/40"; // Silver
    case 3:
      return "from-[#CD7F32]/20 to-[#CD7F32]/40"; // Bronze
    default:
      return "from-emerald-500/10 to-emerald-500/20";
  }
};

const getRankText = (position: number) => {
  switch (position) {
    case 1:
      return "text-[#FFD700]";
    case 2:
      return "text-[#C0C0C0]";
    case 3:
      return "text-[#CD7F32]";
    default:
      return "text-emerald-400";
  }
};

const TraderCard = ({ trader, score, status, position }: TraderCardProps) => {
  const isPositive = status.action === 'BUY';
  
  return (
    <div className="glass-card p-4 rounded-xl mb-3 hover:bg-white/5 transition-all duration-300 group relative overflow-hidden">
      {/* Ranking Column */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b",
        getRankColor(position)
      )} />
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className={cn(
            "absolute -inset-1 rounded-full bg-gradient-to-r blur-sm group-hover:blur-md transition-all duration-300",
            getRankColor(position)
          )} />
          <div className="relative">
            <CircleUserRound className="w-12 h-12 text-white/80" />
            <div className={cn(
              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-xs font-mono",
              getRankText(position)
            )}>
              {position}
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{trader}</h3>
              {position <= 3 && (
                <span className={cn(
                  "text-xs font-mono px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm",
                  getRankText(position)
                )}>
                  #{position} Ranked
                </span>
              )}
            </div>
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
