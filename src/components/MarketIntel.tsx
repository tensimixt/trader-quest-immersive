
import React from 'react';
import PredictionCard from './PredictionCard';
import { motion } from 'framer-motion';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

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
