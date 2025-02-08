
import React, { useState, useEffect } from 'react';
import TradingGlobe from '../components/TradingGlobe';
import PredictionCard from '../components/PredictionCard';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Activity, DollarSign } from 'lucide-react';

// Mock data generator with more fields
const generatePrediction = () => ({
  symbol: ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'AMZN'][Math.floor(Math.random() * 5)],
  prediction: Math.random() > 0.5 ? 'up' : 'down' as 'up' | 'down',
  confidence: Math.floor(Math.random() * 30) + 70,
  timestamp: new Date().toLocaleTimeString(),
  volume: Math.floor(Math.random() * 1000000),
  priceChange: (Math.random() * 10 - 5).toFixed(2),
  id: Math.random().toString(),
});

const Index = () => {
  const [predictions, setPredictions] = useState<Array<any>>([]);
  const [marketStats, setMarketStats] = useState({
    totalVolume: 0,
    avgConfidence: 0,
    upPredictions: 0,
  });

  useEffect(() => {
    // Initial predictions
    setPredictions([
      generatePrediction(),
      generatePrediction(),
      generatePrediction(),
    ]);

    // Add new prediction every 5 seconds
    const interval = setInterval(() => {
      setPredictions(prev => {
        const newPredictions = [...prev, generatePrediction()];
        if (newPredictions.length > 5) {
          newPredictions.shift();
        }
        return newPredictions;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update market stats when predictions change
  useEffect(() => {
    const stats = predictions.reduce((acc, curr) => ({
      totalVolume: acc.totalVolume + curr.volume,
      avgConfidence: acc.avgConfidence + curr.confidence,
      upPredictions: acc.upPredictions + (curr.prediction === 'up' ? 1 : 0),
    }), { totalVolume: 0, avgConfidence: 0, upPredictions: 0 });

    setMarketStats({
      totalVolume: stats.totalVolume,
      avgConfidence: Math.round(stats.avgConfidence / predictions.length),
      upPredictions: stats.upPredictions,
    });
  }, [predictions]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="text-center mb-12">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold mb-4 text-foreground"
          >
            Trading Insights
          </motion.h1>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400"
          >
            Real-time market predictions powered by AI
          </motion.p>
        </div>

        {/* Market Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Volume</span>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold mt-2">{marketStats.totalVolume.toLocaleString()}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg Confidence</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold mt-2">{marketStats.avgConfidence}%</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Up Predictions</span>
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold mt-2">{marketStats.upPredictions}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card rounded-2xl overflow-hidden">
            <TradingGlobe />
          </div>

          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <PredictionCard
                key={prediction.id}
                symbol={prediction.symbol}
                prediction={prediction.prediction}
                confidence={prediction.confidence}
                timestamp={prediction.timestamp}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
