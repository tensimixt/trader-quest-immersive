
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TraderCard from './TraderCard';
import { TraderData } from '@/data/leaderboardData';
import { demoRankChanges } from '@/data/demoData';

interface LeaderboardSectionProps {
  traders: TraderData[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSort: (key: 'rank' | 'roi' | 'score') => void;
  sortConfig: {
    key: 'rank' | 'roi' | 'score' | null;
    direction: 'asc' | 'desc';
  };
}

const LeaderboardSection = ({
  traders,
  searchQuery,
  onSearchChange,
  onSort,
  sortConfig
}: LeaderboardSectionProps) => {
  // Sort traders based on rank changes when rank sort is active
  const sortedTraders = React.useMemo(() => {
    if (sortConfig.key === 'rank') {
      return [...traders].sort((a, b) => {
        const indexA = traders.findIndex(t => t.trader === a.trader);
        const indexB = traders.findIndex(t => t.trader === b.trader);
        const rankChangeA = demoRankChanges[indexA] || 0;
        const rankChangeB = demoRankChanges[indexB] || 0;
        
        // For descending order (default), highest positive changes first
        if (sortConfig.direction === 'desc') {
          // First, compare the absolute values to group positive and negative
          if (rankChangeA >= 0 && rankChangeB < 0) return -1;
          if (rankChangeA < 0 && rankChangeB >= 0) return 1;
          // Then sort by the actual values within each group
          return rankChangeB - rankChangeA;
        }
        // For ascending order, lowest negative changes first
        else {
          // First, compare the absolute values to group positive and negative
          if (rankChangeA >= 0 && rankChangeB < 0) return 1;
          if (rankChangeA < 0 && rankChangeB >= 0) return -1;
          // Then sort by the actual values within each group
          return rankChangeA - rankChangeB;
        }
      });
    }
    return traders;
  }, [traders, sortConfig]);

  return (
    <div className="absolute inset-0">
      <div className="h-full overflow-y-auto custom-scrollbar space-y-4 pb-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Top Traders</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/50" />
              <Input
                type="text"
                placeholder="Search traders..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-black/20 border-emerald-500/20 text-white placeholder:text-emerald-500/50 pl-8"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400/50 text-xs font-mono">
                {traders.length} traders
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort('rank')}
                className={cn(
                  "text-xs font-mono whitespace-nowrap",
                  sortConfig.key === 'rank' && "bg-emerald-500/10 text-emerald-400"
                )}
              >
                Rank Change {sortConfig.key === 'rank' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort('roi')}
                className={cn(
                  "text-xs font-mono whitespace-nowrap",
                  sortConfig.key === 'roi' && "bg-emerald-500/10 text-emerald-400"
                )}
              >
                ROI {sortConfig.key === 'roi' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort('score')}
                className={cn(
                  "text-xs font-mono whitespace-nowrap",
                  sortConfig.key === 'score' && "bg-emerald-500/10 text-emerald-400"
                )}
              >
                Score {sortConfig.key === 'score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </Button>
            </div>
          </div>

          <div className="h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
        </motion.div>
        
        {sortedTraders.map((trader, index) => (
          <motion.div
            key={trader.trader}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <TraderCard
              trader={trader.trader}
              score={trader.score}
              status={trader.status}
              position={index + 1}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardSection;
