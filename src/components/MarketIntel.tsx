
import React from 'react';
import PredictionCard from './PredictionCard';
import { motion } from 'framer-motion';

interface MarketIntelProps {
  predictions: Array<{
    market: string;
    direction: string;
    confidence: number;
    timestamp: string;
    analysis: string;
    roi: number;
  }>;
  isHistoryView: boolean;
  filteredHistory: Array<any>;
  performanceData: any;
  chartRef: React.RefObject<HTMLDivElement>;
}

const MarketIntel = ({
  predictions,
  isHistoryView,
  filteredHistory,
  performanceData,
  chartRef
}: MarketIntelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card rounded-2xl relative overflow-hidden p-6"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
      
      <div className="space-y-4 h-full overflow-y-auto custom-scrollbar pb-20">
        {predictions.map((prediction, index) => (
          <PredictionCard key={index} prediction={prediction} />
        ))}
      </div>
    </motion.div>
  );
};

export default MarketIntel;
