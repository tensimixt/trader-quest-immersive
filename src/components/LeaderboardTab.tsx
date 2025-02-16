
import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Medal, CircleUser, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

type Trader = {
  id: number;
  name: string;
  rank: number;
  score: number;
  status: 'active' | 'inactive' | 'trading';
  winRate: number;
  avatar?: string;
};

const traders: Trader[] = Array.from({ length: 55 }, (_, i) => ({
  id: i + 1,
  name: `Trader${i + 1}`,
  rank: i + 1,
  score: Math.floor(Math.random() * 10000),
  status: ['active', 'inactive', 'trading'][Math.floor(Math.random() * 3)] as Trader['status'],
  winRate: Math.floor(Math.random() * 40) + 60,
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

const getStatusColor = (status: Trader['status']) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-500';
    case 'inactive':
      return 'bg-neutral-500';
    case 'trading':
      return 'bg-blue-500';
    default:
      return 'bg-neutral-500';
  }
};

const LeaderboardTab = () => {
  return (
    <div className="flex-1 overflow-hidden glass-card rounded-xl p-6">
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
              <th className="py-3 px-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Win Rate</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                      <CircleUser className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{trader.name}</span>
                      <span className="text-xs text-neutral-500">ID: {trader.id}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <span className="text-sm text-white">{trader.score.toLocaleString()}</span>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-white">{trader.winRate}%</span>
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", getStatusColor(trader.status))} />
                    <span className="text-sm text-neutral-400 capitalize">{trader.status}</span>
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
