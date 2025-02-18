
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, BarChart2, User, DollarSign, Clock, Target, MessageSquare, Shield } from 'lucide-react';
import { format } from 'date-fns-tz';

interface PredictionCardProps {
  prediction: {
    market: string;
    direction: string;
    confidence: number;
    timestamp: string;
    analysis: string;
    roi: number;
  };
}

const PredictionCard = ({ prediction }: PredictionCardProps) => {
  // Safely handle the timestamp formatting
  const formattedTimestamp = prediction.timestamp ? 
    format(new Date(prediction.timestamp), 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' }) : 
    'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="prediction-card relative overflow-hidden"
    >
      {/* Animated background line */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 animate-pulse" />
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <User className="w-8 h-8 text-emerald-400" />
            <div className="absolute -bottom-1 -right-1">
              <Shield className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-emerald-400">TRADER.SYS</h4>
            <p className="text-xs text-emerald-400/50 font-mono">[AUTHORIZED]</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-emerald-400/70" />
          <span className="text-sm font-mono text-emerald-400/70">{formattedTimestamp}</span>
        </div>
      </div>
      
      {/* Market Info Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white font-mono tracking-wider">{prediction.market}</h3>
          <div className="flex items-center mt-1 space-x-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-mono">SIGNAL_ACTIVE</span>
          </div>
        </div>
        {prediction.direction === 'LONG' ? (
          <div className="flex flex-col items-end">
            <ArrowUpCircle className="w-10 h-10 text-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400 font-mono mt-1">LONG_POSITION</span>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <ArrowDownCircle className="w-10 h-10 text-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-mono mt-1">SHORT_POSITION</span>
          </div>
        )}
      </div>

      {/* Analysis Section */}
      <div className="mb-6 p-4 rounded-lg bg-black/40 border border-emerald-500/20">
        <div className="flex items-center space-x-2 mb-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400 font-mono">ANALYSIS.LOG</span>
        </div>
        <p className="text-sm text-emerald-400/70 font-mono leading-relaxed">
          {prediction.analysis}
        </p>
      </div>
      
      {/* Metrics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400/70 font-mono">CONFIDENCE_RATING</span>
          </div>
          <span className="text-lg font-bold text-emerald-400 font-mono">{prediction.confidence}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-black/40 rounded-full h-1.5 relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${prediction.confidence}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              prediction.direction === 'LONG' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
        </div>
        
        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-emerald-500/10">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400/70 font-mono">SIGNAL</span>
            </div>
            <span className="text-xs font-medium text-emerald-400 font-mono">
              {prediction.confidence > 80 ? 'STRONG' : 'MODERATE'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-emerald-500/10">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400/70 font-mono">ROI</span>
            </div>
            <span className={`text-xs font-medium font-mono ${prediction.direction === 'LONG' ? 'text-emerald-400' : 'text-red-400'}`}>
              {prediction.roi > 0 ? '+' : ''}{prediction.roi}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PredictionCard;
