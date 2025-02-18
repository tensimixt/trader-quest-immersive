
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TraderCard from './TraderCard';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSort: (key: 'rank' | 'roi' | 'score') => void;
  sortedAndFilteredLeaderboard: Array<any>;
}

const Leaderboard = ({
  searchQuery,
  setSearchQuery,
  handleSort,
  sortedAndFilteredLeaderboard
}: LeaderboardProps) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search traders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            onClick={() => handleSort('rank')}
            className={cn(
              "px-2 py-1 rounded hover:bg-white/5",
              "transition-colors duration-200"
            )}
          >
            Rank Change
          </button>
          <button
            onClick={() => handleSort('roi')}
            className={cn(
              "px-2 py-1 rounded hover:bg-white/5",
              "transition-colors duration-200"
            )}
          >
            ROI
          </button>
          <button
            onClick={() => handleSort('score')}
            className={cn(
              "px-2 py-1 rounded hover:bg-white/5",
              "transition-colors duration-200"
            )}
          >
            Score
          </button>
        </div>
        
        <div className="space-y-4">
          {sortedAndFilteredLeaderboard.map((trader, index) => (
            <TraderCard
              key={trader.trader}
              trader={trader.trader}
              score={trader.score}
              status={trader.status}
              position={index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
