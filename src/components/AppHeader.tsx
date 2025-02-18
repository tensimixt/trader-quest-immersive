
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Network } from 'lucide-react';

export const AppHeader = () => {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-center relative h-[10vh] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 blur-xl" />
      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="relative w-8 h-8">
            <motion.div
              className="absolute inset-0 border-2 border-emerald-400 rounded-full"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-[4px] border-2 border-emerald-400/80 rounded-full"
              animate={{ scale: [1.1, 1, 1.1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
            />
            <div className="absolute inset-[8px] flex items-center justify-center">
              <motion.div
                className="w-1 h-1 bg-emerald-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="w-1 h-1 bg-emerald-400 rounded-full ml-1"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
              />
              <motion.div
                className="w-1 h-1 bg-emerald-400 rounded-full ml-1"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 1 }}
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-wider">
            COPE<span className="text-emerald-400">NET</span>
          </h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400/70" />
          <p className="text-sm text-emerald-400/70 font-mono tracking-[0.2em]">
            MARKET_INTELLIGENCE_MATRIX
          </p>
          <Network className="w-4 h-4 text-emerald-400/70" />
        </div>
      </div>
    </motion.div>
  );
};
