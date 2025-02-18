
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
    roi?: number; // Added ROI to status
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
  
  // Demo ROI values for visualization
  const demoROI = [
    8.42, -3.21, 12.54, 5.67, -2.18, 15.32, 7.89, -4.56, 9.23, 3.45,
    -1.98, 6.78, 11.23, -5.43, 4.56, 8.90, -2.34, 13.45, 6.78, -3.21
  ][position % 20];
  
  return (
    <div className="glass-card p-6 rounded-xl mb-4 hover:bg-white/5 transition-all duration-300 group relative overflow-hidden">
      {/* Enhanced side indicator with gradient */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b",
        getRankColor(position)
      )} />
      
      <div className="flex items-start gap-6">
        {/* Avatar section with enhanced visual effects */}
        <div className="relative pt-1">
          <div className={cn(
            "absolute -inset-2 rounded-full bg-gradient-to-r blur-md group-hover:blur-lg transition-all duration-300",
            getRankColor(position)
          )} />
          <div className="relative">
            <CircleUserRound className="w-14 h-14 text-white/90" />
            <div className={cn(
              "absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-xs font-mono font-bold",
              getRankText(position)
            )}>
              {position}
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          {/* Header section with trader info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-white tracking-tight">{trader}</h3>
              {position <= 3 && (
                <span className={cn(
                  "text-xs font-mono px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm font-medium",
                  getRankText(position)
                )}>
                  #{position} Ranked
                </span>
              )}
            </div>
            <span className="text-2xl font-mono text-emerald-400 font-bold tracking-tight">
              {score.toLocaleString()}
            </span>
          </div>
          
          {/* Trading activity section with enhanced spacing */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                {isPositive ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className={cn(
                  "text-sm font-mono font-medium",
                  isPositive ? "text-emerald-400" : "text-red-400"
                )}>
                  {status.action} {status.pair}
                </span>
              </div>
              
              {/* ROI indicator with enhanced visual treatment */}
              <span className={cn(
                "text-sm font-mono px-3 py-1 rounded-full backdrop-blur-sm border border-white/10",
                demoROI >= 0 ? "text-emerald-400 bg-emerald-400/5" : "text-rose-400 bg-rose-400/5"
              )}>
                {formatROI(demoROI)}
              </span>
            </div>
            
            {/* Enhanced timestamp with better spacing */}
            <span className="text-xs text-white/60 font-medium">
              {formatDistanceToNow(status.timestamp, { addSuffix: true })}
            </span>
            
            {/* Rank change indicator with enhanced animation and spacing */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "ml-auto flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10",
                getRankChangeColor(actualRankChange)
              )}
            >
              {getRankChangeIcon(actualRankChange)}
              <span className="font-medium whitespace-nowrap tracking-tight">
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
