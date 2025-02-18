
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-10 rounded-2xl mb-8 hover:bg-white/5 transition-all duration-500 group relative overflow-hidden"
    >
      {/* Enhanced side indicator with gradient */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b",
        getRankColor(position)
      )} />
      
      {/* Ambient glow effect */}
      <div className={cn(
        "absolute -inset-2 opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50",
        getRankColor(position)
      )} />
      
      <div className="flex items-start gap-10 relative">
        {/* Avatar section with enhanced visual effects */}
        <div className="relative pt-1">
          <div className={cn(
            "absolute -inset-4 rounded-full bg-gradient-to-r blur-xl group-hover:blur-2xl transition-all duration-500",
            getRankColor(position)
          )} />
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <CircleUserRound className="w-20 h-20 text-white/90" />
            <div className={cn(
              "absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-sm font-mono font-bold border border-white/10",
              getRankText(position)
            )}>
              {position}
            </div>
          </motion.div>
        </div>
        
        <div className="flex-1 space-y-6">
          {/* Header section with trader info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-bold text-white tracking-tight">{trader}</h3>
              {position <= 3 && (
                <motion.span 
                  whileHover={{ scale: 1.05 }}
                  className={cn(
                    "text-xs font-mono px-5 py-2 rounded-full bg-black/40 backdrop-blur-md font-medium border border-white/10",
                    getRankText(position)
                  )}
                >
                  #{position} Ranked
                </motion.span>
              )}
            </div>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="text-3xl font-mono text-emerald-400 font-bold tracking-tight px-5 py-2 rounded-full bg-emerald-400/5 backdrop-blur-md border border-emerald-400/20"
            >
              {score.toLocaleString()}
            </motion.span>
          </div>
          
          {/* Trading activity section with enhanced spacing */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-5">
                {isPositive ? (
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="p-3 rounded-full bg-emerald-400/10 border border-emerald-400/20 backdrop-blur-md"
                  >
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="p-3 rounded-full bg-red-400/10 border border-red-400/20 backdrop-blur-md"
                  >
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  </motion.div>
                )}
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "text-base font-mono font-medium px-5 py-2.5 rounded-full backdrop-blur-md border",
                    isPositive 
                      ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/20" 
                      : "text-red-400 bg-red-400/5 border-red-400/20"
                  )}
                >
                  {status.action} {status.pair}
                </motion.span>
              </div>
              
              {/* ROI indicator with enhanced visual treatment */}
              <motion.span
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "text-base font-mono font-medium px-5 py-2.5 rounded-full backdrop-blur-md border",
                  demoROI >= 0 
                    ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/20" 
                    : "text-rose-400 bg-rose-400/5 border-rose-400/20"
                )}
              >
                {formatROI(demoROI)}
              </motion.span>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              {/* Enhanced timestamp with better spacing */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10"
              >
                <Clock className="w-4 h-4 text-white/70" />
                <span className="text-sm font-medium text-white/70">
                  {formatDistanceToNow(status.timestamp, { addSuffix: true })}
                </span>
              </motion.div>
              
              {/* Rank change indicator with enhanced animation and spacing */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 100 }}
                className={cn(
                  "flex items-center gap-3 text-sm font-mono px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10",
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
    </motion.div>
  );
};

export default TraderCard;
