
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, BarChart2 } from 'lucide-react';

interface PredictionCardProps {
  symbol: string;
  prediction: 'up' | 'down';
  confidence: number;
  timestamp: string;
}

const PredictionCard = ({ symbol, prediction, confidence, timestamp }: PredictionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="prediction-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-400">{timestamp}</span>
          <span className="px-2 py-1 text-xs rounded-full bg-white/10 text-gray-300">
            Live
          </span>
        </div>
        {prediction === 'up' ? (
          <ArrowUpCircle className="w-6 h-6 text-green-500" />
        ) : (
          <ArrowDownCircle className="w-6 h-6 text-red-500" />
        )}
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold">{symbol}</h3>
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Vol. 24h</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Confidence</span>
          <span className="text-lg font-semibold">{confidence}%</span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              prediction === 'up' ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Signal Strength</span>
          <span className={`font-medium ${confidence > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
            {confidence > 80 ? 'Strong' : 'Moderate'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PredictionCard;
