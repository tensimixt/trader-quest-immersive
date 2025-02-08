
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, BarChart2, User, DollarSign, Clock, Target } from 'lucide-react';

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
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-purple-400" />
          <div>
            <h4 className="text-sm font-medium text-gray-200">Trader Profile</h4>
            <p className="text-xs text-gray-400">Expert Level</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-400">{timestamp}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">{symbol}</h3>
          <div className="flex items-center mt-1 space-x-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">Market Active</span>
          </div>
        </div>
        {prediction === 'up' ? (
          <div className="flex flex-col items-end">
            <ArrowUpCircle className="w-8 h-8 text-green-500 mb-1" />
            <span className="text-xs text-green-400">Bullish Signal</span>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <ArrowDownCircle className="w-8 h-8 text-red-500 mb-1" />
            <span className="text-xs text-red-400">Bearish Signal</span>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">Confidence</span>
          </div>
          <span className="text-lg font-semibold text-purple-400">{confidence}%</span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              prediction === 'up' ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Current ROI</span>
          </div>
          <span className={`text-sm font-medium ${prediction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {prediction === 'up' ? '+' : '-'}${Math.floor(Math.random() * 1000)}
          </span>
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
