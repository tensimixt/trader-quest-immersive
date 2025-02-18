
import React from 'react';
import PredictionCard from './PredictionCard';
import { motion } from 'framer-motion';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { History, ArrowLeft } from 'lucide-react';

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
  onBackToIntel?: () => void;
}

const MarketIntel = ({
  predictions,
  isHistoryView,
  filteredHistory,
  performanceData,
  chartRef,
  onBackToIntel
}: MarketIntelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card rounded-2xl relative overflow-hidden p-6 bg-[#0a0b0d]"
    >
      {isHistoryView ? (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#5ebbff]" />
            <h2 className="text-lg font-mono text-[#5ebbff]">MARKET_HISTORY</h2>
            <span className="w-2 h-2 rounded-full bg-[#5ebbff] ml-2"></span>
          </div>
          <button 
            onClick={onBackToIntel}
            className="flex items-center gap-2 text-[#4ade80] hover:text-[#4ade80]/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono">Back to Intel</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-mono text-emerald-400">MARKET_INTEL</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400/70 font-mono">LIVE</span>
          </div>
        </div>
      )}
      
      {isHistoryView ? (
        <div className="space-y-4 h-full overflow-y-auto custom-scrollbar pb-20">
          {performanceData ? (
            <div ref={chartRef} className="w-full h-[400px] bg-[#0a0b0d] rounded-xl">
              <ResponsiveContainer width="100%" height="90%">
                <BarChart 
                  data={performanceData.monthlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#1f2937" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="month" 
                    stroke="#4ade80" 
                    tick={{ fill: '#4ade80', fontSize: 14 }}
                    axisLine={{ stroke: '#1f2937' }}
                  />
                  <YAxis 
                    stroke="#4ade80" 
                    tick={{ fill: '#4ade80', fontSize: 14 }}
                    domain={[0, 100]}
                    axisLine={{ stroke: '#1f2937' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0b0d',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#4ade80'
                    }}
                  />
                  <Bar 
                    dataKey="winRate" 
                    fill="#4ade80"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <h3 className="text-[#4ade80] font-mono text-center mt-2 text-lg">Monthly Win Rate Analysis</h3>
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
