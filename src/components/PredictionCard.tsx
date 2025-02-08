
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

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
        <span className="text-sm font-medium text-gray-500">{timestamp}</span>
        {prediction === 'up' ? (
          <ArrowUpCircle className="w-6 h-6 text-green-500" />
        ) : (
          <ArrowDownCircle className="w-6 h-6 text-red-500" />
        )}
      </div>
      <h3 className="text-2xl font-bold mb-2">{symbol}</h3>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Confidence</span>
        <span className="text-lg font-semibold">{confidence}%</span>
      </div>
      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            prediction === 'up' ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </motion.div>
  );
};

export default PredictionCard;
