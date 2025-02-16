
import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Medal, CircleUser, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type Trader = {
  id: number;
  name: string;
  rank: number;
  score: number;
  status: {
    action: 'BUY' | 'SELL';
    pair: string;
    timestamp: Date;
  };
  avatar?: string;
};

const traders: Trader[] = Array.from({ length: 55 }, (_, i) => ({
  id: i + 1,
  name: `Trader${i + 1}`,
  rank: i + 1,
  score: Math.floor(Math.random() * 10000),
  status: {
    action: Math.random() > 0.5 ? 'BUY' : 'SELL',
    pair: ['BTC/USD', 'ETH/USD', 'SOL/USD'][Math.floor(Math.random() * 3)],
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000))
  },
  avatar: undefined
}));

// Override first few traders with special names
traders[0].name = 'Hsaka';
traders[1].name = 'CryptoCapo';
traders[2].name = 'PlanB';
traders[3].name = 'RookieXBT';
traders[4].name = 'CredibleCrypto';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400" />;
    case 2:
      return <Trophy className="w-5 h-5 text-gray-300" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-sm text-neutral-400">#{rank}</span>;
  }
};

const getStatusColor = (action: 'BUY' | 'SELL') => {
  return action === 'BUY' ? 'text-emerald-400' : 'text-red-400';
};

const getActionIcon = (action: 'BUY' | 'SELL') => {
  return action === 'BUY' ? (
    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
  ) : (
    <ArrowDownRight className="w-3 h-3 text-red-400" />
  );
};

const LeaderboardTab = () => {
  return (
    <div className="flex-1 overflow-hidden glass-card rounded-xl p-6 bg-[#0a0a0c]/80">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-emerald-400" />
          Trader Leaderboard
        </h2>
        <p className="text-sm text-neutral-400 mt-1">Top performing traders ranked by score</p>
      </div>

      <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-250px)]">
        <table className="w-full">
          <thead className="sticky top-0 bg-black/50 backdrop-blur-sm">
            <tr className="border-b border-white/5">
              <th className="py-3 px-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Rank</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Trader</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Score</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Latest Trade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {traders.map((trader, index) => (
              <motion.tr
                key={trader.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getRankIcon(trader.rank)}
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a1a1c] to-[#2a2a2c] border border-white/10 shadow-lg flex items-center justify-center">
                      <CircleUser className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{trader.name}</span>
                      <span className="text-xs text-neutral-500">ID: {trader.id}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="bg-white/5 rounded-full px-3 py-1 inline-flex items-center">
                    <span className="text-sm text-white font-mono">{trader.score.toLocaleString()}</span>
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      {getActionIcon(trader.status.action)}
                      <span className={cn("text-sm font-medium", getStatusColor(trader.status.action))}>
                        {trader.status.action}
                      </span>
                      <span className="text-sm text-white font-medium">
                        {trader.status.pair}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(trader.status.timestamp)} ago</span>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTab;
