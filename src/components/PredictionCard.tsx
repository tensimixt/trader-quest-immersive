
import React from 'react';
import { motion } from 'framer-motion';
import { User2, MessageSquare, Activity, DollarSign, ArrowUp } from 'lucide-react';

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
      className="prediction-card relative p-6 rounded-xl border border-emerald-500/10 mb-4 bg-[#0D1117]/95"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/5 p-2 rounded-full">
            <User2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-emerald-400 font-mono text-sm tracking-wide">TRADER.SYS</div>
            <div className="text-emerald-400/40 text-xs font-mono tracking-wide">[AUTHORIZED]</div>
          </div>
        </div>
        <div className="text-emerald-400/40 font-mono text-xs tracking-wider">
          {timestamp}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-3xl font-bold text-white font-mono tracking-tight">{symbol}</h3>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-sm tracking-wide">SIGNAL_ACTIVE</span>
        </div>
      </div>

      <div className="bg-black/40 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-emerald-400/50" />
          <span className="text-emerald-400/50 font-mono text-sm tracking-wide">ANALYSIS.LOG</span>
        </div>
        <p className="text-emerald-400 font-mono text-sm leading-relaxed tracking-wide">{traderText}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-emerald-400/50" />
            <span className="text-emerald-400/50 font-mono text-sm tracking-wide">CONFIDENCE_RATING</span>
          </div>
          <span className="text-emerald-400 font-mono text-lg">{confidence}%</span>
        </div>
        <div className="h-1 bg-black/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-emerald-400"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-sm tracking-wide">SIGNAL</span>
          <span className="text-emerald-400 font-mono text-sm tracking-wide">STRONG</span>
        </div>
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-sm tracking-wide">ROI</span>
          <span className="text-emerald-400 font-mono">+$173</span>
        </div>
      </div>

      <div className="absolute top-6 right-6 flex flex-col items-end gap-1">
        <div className="bg-emerald-500/10 p-2.5 rounded-full">
          <ArrowUp className="w-6 h-6 text-emerald-400" />
        </div>
        <span className="text-emerald-400 font-mono text-xs tracking-wide">
          {prediction === 'up' ? 'LONG_POSITION' : 'SHORT_POSITION'}
        </span>
      </div>
    </motion.div>
  );
};

export default PredictionCard;
