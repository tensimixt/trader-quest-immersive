
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CircleUserRound, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TraderCardProps {
  trader: string;
  score: number;
  status: {
    action: 'BUY' | 'SELL';
    pair: string;
    timestamp: Date;
    roi?: number;
  };
  position: number;
  rankChange?: number;
}

const getRankColor = (position: number) => {
  switch (position) {
    case 1:
      return "from-[#FFD700]/20 to-[#FFD700]/40";
    case 2:
      return "from-[#C0C0C0]/20 to-[#C0C0C0]/40";
    case 3:
      return "from-[#CD7F32]/20 to-[#CD7F32]/40";
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

const formatROI = (roi: number) => {
  const formattedROI = roi.toFixed(2);
  return roi > 0 ? `+${formattedROI}%` : `${formattedROI}%`;
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
  
  const demoROI = [
    8.42, -3.21, 12.54, 5.67, -2.18, 15.32, 7.89, -4.56, 9.23, 3.45,
    -1.98, 6.78, 11.23, -5.43, 4.56, 8.90, -2.34, 13.45, 6.78, -3.21
  ][position % 20];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 rounded-xl mb-4 hover:bg-white/[0.02] transition-all duration-500 group relative overflow-hidden"
    >
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b",
        getRankColor(position)
      )} />
      
      <div className="flex items-start gap-5">
        <div className="relative shrink-0">
          <div className={cn(
            "absolute -inset-1 rounded-full bg-gradient-to-r blur-md opacity-50",
            getRankColor(position)
          )} />
          <motion.div whileHover={{ scale: 1.05 }} className="relative">
            <CircleUserRound className="w-10 h-10 text-white/90" />
            <div className={cn(
              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center text-xs font-mono font-bold border border-white/5",
              getRankText(position)
            )}>
              {position}
            </div>
          </motion.div>
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-mono uppercase tracking-wide text-white/90 font-medium truncate">{trader}</h3>
              {position <= 3 && (
                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40",
                  getRankText(position)
                )}>
                  FOX-{position}
                </span>
              )}
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-mono px-2.5 py-1 rounded-full",
                getRankChangeColor(actualRankChange)
              )}
            >
              {getRankChangeIcon(actualRankChange)}
              <span className="font-medium whitespace-nowrap">
                {getRankChangeLabel(actualRankChange)}
              </span>
            </motion.div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-1.5 rounded-full",
                isPositive ? "bg-emerald-400/5" : "bg-red-400/5"
              )}>
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400/90" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400/90" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs uppercase tracking-wide font-mono",
                  isPositive ? "text-emerald-400/90" : "text-red-400/90"
                )}>
                  {status.action} {status.pair}
                </span>
                
                <span className={cn(
                  "text-xs uppercase tracking-wide font-mono",
                  demoROI >= 0 ? "text-emerald-400/90" : "text-rose-400/90"
                )}>
                  {formatROI(demoROI)}
                </span>
                
                <div className="w-[1px] h-3 bg-white/10 mx-1" />
                
                <span className="text-[10px] uppercase tracking-wide font-mono text-white/40 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-white/40" />
                  {formatDistanceToNow(status.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
            
            <motion.span 
              whileHover={{ scale: 1.02 }}
              className="text-lg font-mono text-emerald-400/90 font-bold tracking-wider"
            >
              {score.toLocaleString()}
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TraderCard;
