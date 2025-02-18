import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CircleUserRound, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TraderCardProps {
  trader: string;
  score: number;
  status: {
    action: 'BUY' | 'SELL';
    pair: string;
    timestamp: Date;
  };
  position: number;
  rankChange?: number;
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

const getRankChangeColor = (change: number) => {
  if (change > 0) return "text-emerald-400 bg-emerald-400/10";
  if (change < 0) return "text-rose-400 bg-rose-400/10";
  return "text-blue-400 bg-blue-400/10";
};

const getRankChangeLabel = (change: number) => {
  if (change > 0) return `Moved up ${change} position${change > 1 ? 's' : ''}`;
  if (change < 0) return `Moved down ${Math.abs(change)} position${Math.abs(change) > 1 ? 's' : ''}`;
  return "Rank unchanged";
};

const getRankChangeIcon = (change: number) => {
  if (change > 0) return <ArrowUp className="w-3 h-3" />;
  if (change < 0) return <ArrowDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
};

const TraderCard = ({ trader, score, status, position, rankChange = 0 }: TraderCardProps) => {
  const isPositive = status.action === 'BUY';
  
  const demoRankChanges = [
    2, -1, 3, 0, -2, 1, 4, -3, 0, 2,
    -4, 1, -2, 3, 0, 2, -1, 5, -2, 1,
    0, 3, -2, 1, -3
  ];
  
  const actualRankChange = demoRankChanges[position % demoRankChanges.length];
  
  return (
    <div className="glass-card p-4 rounded-xl mb-3 hover:bg-white/5 transition-all duration-300 group relative overflow-hidden">
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
          
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-2">
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
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "ml-auto flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-full backdrop-blur-sm border border-white/5",
                getRankChangeColor(actualRankChange)
              )}
            >
              {getRankChangeIcon(actualRankChange)}
              <span className="font-medium whitespace-nowrap">
                {getRankChangeLabel(actualRankChange)}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraderCard;
