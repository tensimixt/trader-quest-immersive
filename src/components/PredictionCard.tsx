
import React from 'react';
import { motion } from 'framer-motion';
import { User2, MessageSquare, Activity, DollarSign, ArrowUp, Clock } from 'lucide-react';

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
      className="prediction-card relative p-8 rounded-2xl border border-emerald-500/10 mb-4 bg-[#0D1117]/95"
    >
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <User2 className="w-6 h-6 text-emerald-400" />
          <div>
            <div className="text-emerald-400 font-mono text-lg tracking-wide">TRADER.SYS</div>
            <div className="text-emerald-400/40 text-sm font-mono tracking-wide">[AUTHORIZED]</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-400/60 font-mono text-sm tracking-wider">
          <Clock className="w-4 h-4" />
          {timestamp}
        </div>
      </div>

      <div className="mb-3">
        <h3 className="text-4xl font-bold text-white font-mono tracking-tight mb-3">{symbol}</h3>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-sm tracking-wide">SIGNAL_ACTIVE</span>
        </div>
      </div>

      <div className="bg-black/40 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-lg tracking-wide">ANALYSIS.LOG</span>
        </div>
        <p className="text-emerald-400/80 font-mono text-base leading-relaxed tracking-wide">{traderText}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-emerald-400" />
            <span className="text-emerald-400 font-mono text-lg tracking-wide">CONFIDENCE_RATING</span>
          </div>
          <span className="text-emerald-400 font-mono text-2xl">{confidence}%</span>
        </div>
        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-emerald-400"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/60 px-6 py-3 rounded-xl">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-base tracking-wide">SIGNAL</span>
          <span className="text-emerald-400 font-mono text-base tracking-wide">STRONG</span>
        </div>
        <div className="flex items-center gap-3 bg-black/60 px-6 py-3 rounded-xl">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-base tracking-wide">ROI</span>
          <span className="text-emerald-400 font-mono text-base">+$173</span>
        </div>
      </div>

      <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
        <div className="bg-emerald-500/10 p-3 rounded-full">
          <ArrowUp className="w-8 h-8 text-emerald-400" />
        </div>
        <span className="text-emerald-400 font-mono text-sm tracking-wide">
          {prediction === 'up' ? 'LONG_POSITION' : 'SHORT_POSITION'}
        </span>
      </div>
    </motion.div>
  );
};

export default PredictionCard;
