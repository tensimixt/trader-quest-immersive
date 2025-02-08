import React, { useState, useEffect } from 'react';
import TradingGlobe from '../components/TradingGlobe';
import PredictionCard from '../components/PredictionCard';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Activity, DollarSign } from 'lucide-react';

// Sample trader texts for different scenarios
const bullishTexts = [
  "Strong bullish divergence on RSI with increasing volume. Target: key resistance at upper Bollinger Band.",
  "Multiple timeframe analysis shows bullish momentum. Watch for breakout above EMA200.",
  "Price action forming ascending triangle with higher lows. Expecting upward movement.",
];

const bearishTexts = [
  "Breaking below key support with increasing selling pressure. Watch for continuation.",
  "Bearish engulfing pattern on the 4h chart with declining volume. Targeting next support.",
  "Double top formation complete with bearish MACD crossover. Risk management crucial.",
];

// Mock data generator with more fields
const generatePrediction = () => {
  const isPredictionUp = Math.random() > 0.5;
  return {
    symbol: ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'AMZN'][Math.floor(Math.random() * 5)],
    prediction: isPredictionUp ? 'up' : 'down' as 'up' | 'down',
    confidence: Math.floor(Math.random() * 30) + 70,
    timestamp: new Date().toLocaleTimeString(),
    volume: Math.floor(Math.random() * 1000000),
    priceChange: (Math.random() * 10 - 5).toFixed(2),
    traderText: isPredictionUp 
      ? bullishTexts[Math.floor(Math.random() * bullishTexts.length)]
      : bearishTexts[Math.floor(Math.random() * bearishTexts.length)],
    id: Math.random().toString(),
  };
};

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
    <div className="min-h-screen bg-[#1A1F2C] overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto py-16 px-4"
      >
        {/* Header Section */}
        <div className="mb-16">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 blur-xl" />
            <h1 className="text-6xl font-bold mb-6 text-white relative">
              FOX<span className="text-emerald-400">DIE</span>
            </h1>
            <p className="text-xl text-emerald-400/70 font-mono tracking-wider">
              MARKET_SURVEILLANCE_SYSTEM v2.1
            </p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
          {/* Left Column - Globe and Stats */}
          <div className="space-y-8">
            {/* Globe Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl overflow-hidden relative min-h-[600px]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0" />
              <div className="p-8 relative">
                <TradingGlobe />
              </div>
            </motion.div>

            {/* Stats Section Below Globe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0" />
              <div className="p-8 relative">
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'VOLUME_INDEX', value: marketStats.totalVolume.toLocaleString(), icon: <Activity /> },
                    { label: 'CONFIDENCE_MATRIX', value: `${marketStats.avgConfidence}%`, icon: <TrendingUp /> },
                    { label: 'BULLISH_SIGNALS', value: marketStats.upPredictions, icon: <DollarSign /> }
                  ].map((stat, index) => (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          {stat.icon}
                        </div>
                      </div>
                      <p className="text-emerald-400/70 font-mono text-sm tracking-wider mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Predictions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="glass-card p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0" />
              <h2 className="text-2xl font-bold text-white mb-4 relative">MARKET_PREDICTIONS</h2>
              <div className="space-y-4">
                {predictions.map((prediction, index) => (
                  <motion.div
                    key={prediction.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PredictionCard
                      symbol={prediction.symbol}
                      prediction={prediction.prediction}
                      confidence={prediction.confidence}
                      timestamp={prediction.timestamp}
                      traderText={prediction.traderText}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
