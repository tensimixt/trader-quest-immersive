
import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Medal, CircleUser, ArrowUpRight, ArrowDownRight, Clock, Sparkles } from 'lucide-react';
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
      return <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
    case 2:
      return <Trophy className="w-5 h-5 text-gray-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />;
    default:
      return <span className="text-sm text-neutral-400/80 font-mono tracking-wider">#{rank}</span>;
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
    <div className="flex-1 overflow-hidden glass-card rounded-xl p-6 bg-gradient-to-br from-[#0a0a0c]/90 to-[#1a1a1c]/90">
      <div className="mb-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <Trophy className="w-7 h-7 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-400 to-emerald-600">
            Trader Leaderboard
          </h2>
          <Sparkles className="w-5 h-5 text-emerald-400/50 animate-pulse" />
        </motion.div>
        <p className="text-sm text-neutral-400 tracking-wide">Real-time ranking of top performing traders</p>
      </div>

      <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-250px)]">
        <table className="w-full">
          <thead className="sticky top-0 bg-black/80 backdrop-blur-xl">
            <tr className="border-b border-white/5">
              <th className="py-3 px-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider w-[80px]">Rank</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Trader</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider w-[120px]">Score</th>
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
                className="hover:bg-white/5 transition-all duration-300 group relative hover:bg-gradient-to-r hover:from-emerald-500/5 hover:to-transparent"
              >
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getRankIcon(trader.rank)}
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a1a1c] to-[#2a2a2c] border border-white/10 shadow-lg flex items-center justify-center group-hover:border-emerald-500/20 transition-all duration-300"
                      >
                        <CircleUser className="w-5 h-5 text-white/80" />
                      </motion.div>
                      {trader.rank <= 3 && (
                        <>
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400/20 animate-ping" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400/40" />
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-white group-hover:text-emerald-400 transition-all duration-300">
                        {trader.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono tracking-wider group-hover:text-neutral-400 transition-all duration-300">
                        ID: {trader.id}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-r from-white/5 to-white/10 rounded-full px-3 py-1 inline-flex items-center border border-white/5 group-hover:border-emerald-500/20 transition-all duration-300 shadow-lg"
                  >
                    <span className="text-sm text-white font-mono tracking-wider">{trader.score.toLocaleString()}</span>
                  </motion.div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-2">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1 border border-white/5 w-fit group-hover:border-emerald-500/20 transition-all duration-300 shadow-lg"
                    >
                      {getActionIcon(trader.status.action)}
                      <span className={cn("text-sm font-medium tracking-wider", getStatusColor(trader.status.action))}>
                        {`${trader.status.action} ${trader.status.pair}`}
                      </span>
                    </motion.div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 group-hover:text-emerald-400/50 transition-all duration-300">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono tracking-wider">{formatDistanceToNow(trader.status.timestamp)} ago</span>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent pointer-events-none" />
    </div>
  );
};

export default LeaderboardTab;
