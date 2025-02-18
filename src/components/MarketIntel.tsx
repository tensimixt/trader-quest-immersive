
import React from 'react';
import PredictionCard from './PredictionCard';
import { motion } from 'framer-motion';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Eye } from 'lucide-react';

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
      
      {/* Market Intel Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-mono text-emerald-400">
            {isHistoryView ? "MARKET_HISTORY" : "MARKET_INTEL"} •
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400/70 font-mono">LIVE</span>
        </div>
      </div>
      
      {isHistoryView ? (
        <div className="space-y-4 h-full overflow-y-auto custom-scrollbar pb-20">
          {performanceData ? (
            <div ref={chartRef} className="w-full h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData.monthlyData}>
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#64748b'
                    }}
                  />
                  <Bar dataKey="winRate" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            filteredHistory.map((prediction, index) => (
              <PredictionCard key={index} prediction={prediction} />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4 h-full overflow-y-auto custom-scrollbar pb-20">
          {predictions.map((prediction, index) => (
            <PredictionCard key={index} prediction={prediction} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MarketIntel;
