
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TraderCard from '@/components/TraderCard';
import { Search, ArrowUpDown, TrendingUp, Clock } from 'lucide-react';

interface LeaderboardProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSort: (key: 'rank' | 'roi' | 'time') => void;
  sortedAndFilteredLeaderboard: Array<any>;
}

const Leaderboard = ({
  searchQuery,
  setSearchQuery,
  handleSort,
  sortedAndFilteredLeaderboard
}: LeaderboardProps) => {
  return (
    <div className="h-full flex flex-col">
      {/* Search and Filters */}
      <div className="mb-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 w-4 h-4" />
          <Input
            placeholder="Search traders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/20 border-emerald-500/20 text-white placeholder:text-emerald-500/50"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('rank')}
            className="flex items-center gap-2 bg-black/20 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-400"
          >
            <ArrowUpDown className="w-4 h-4" />
            Rank
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('roi')}
            className="flex items-center gap-2 bg-black/20 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-400"
          >
            <TrendingUp className="w-4 h-4" />
            ROI
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('time')}
            className="flex items-center gap-2 bg-black/20 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-400"
          >
            <Clock className="w-4 h-4" />
            Time
          </Button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
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
  );
};

export default Leaderboard;
