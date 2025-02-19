
import React from 'react';
import { motion } from 'framer-motion';
import { User2, ArrowUp, ArrowDown, Activity, DollarSign } from 'lucide-react';

interface PredictionCardProps {
  symbol: string;
  prediction: 'up' | 'down';
  confidence: number;
  timestamp: string;
  traderText: string;
}

const PredictionCard = ({
  symbol,
  prediction,
  confidence,
  timestamp,
  traderText
}: PredictionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card p-4 rounded-xl border border-emerald-500/10 mb-4 bg-black/60"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/10 p-2 rounded-full">
            <User2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-emerald-400 font-mono text-sm">TRADER.SYS</div>
            <div className="text-emerald-400/50 text-xs font-mono">[AUTHORIZED]</div>
          </div>
        </div>
        <div className="text-emerald-400/50 font-mono text-xs">
          {timestamp}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-2xl font-bold text-white font-mono">{symbol}</h3>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-sm">SIGNAL_ACTIVE</span>
        </div>
      </div>

      <div className="bg-black/40 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm mb-2">
          <span className="text-emerald-400/50">ANALYSIS.LOG</span>
        </div>
        <p className="text-emerald-400 font-mono text-sm">{traderText}</p>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-emerald-400/50 font-mono text-sm">CONFIDENCE_RATING</span>
          <span className="text-emerald-400 font-mono">{confidence}%</span>
        </div>
        <div className="h-1 bg-black/40 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-emerald-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-sm">STRONG</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-sm">ROI</span>
          <span className="text-emerald-400 font-mono">+$173</span>
        </div>
      </div>

      <div className="absolute top-4 right-4">
        {prediction === 'up' ? (
          <div className="bg-emerald-500/10 p-2 rounded-full">
            <ArrowUp className="w-5 h-5 text-emerald-400" />
          </div>
        ) : (
          <div className="bg-red-500/10 p-2 rounded-full">
            <ArrowDown className="w-5 h-5 text-red-400" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PredictionCard;
