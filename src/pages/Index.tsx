import React, { useState, useEffect } from 'react';
import TradingGlobe from '../components/TradingGlobe';
import PredictionCard from '../components/PredictionCard';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, DollarSign, Shield, Eye, Network } from 'lucide-react';

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
    <div className="min-h-screen overflow-hidden bat-grid">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 h-screen flex flex-col"
      >
        {/* Header - Wayne Enterprises Command Center */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center relative h-[10vh] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 blur-xl" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-6 h-6 text-emerald-400" />
              <h1 className="text-4xl font-bold text-white tracking-wider">
                WAYNE<span className="text-emerald-400">NET</span>
              </h1>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400/70" />
              <p className="text-sm text-emerald-400/70 font-mono tracking-[0.2em]">
                MARKET_SURVEILLANCE_PROTOCOL
              </p>
              <Network className="w-4 h-4 text-emerald-400/70" />
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4 h-[90vh]">
          {/* Left Column - Globe and Stats */}
          <div className="col-span-8 grid grid-rows-2 gap-4">
            {/* Globe Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl overflow-hidden relative row-span-1 bat-glow"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
              <div className="h-full relative">
                <TradingGlobe />
              </div>
            </motion.div>

            {/* Stats Matrix */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl overflow-hidden relative"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
              <div className="p-6 relative h-full flex items-center">
                <div className="grid grid-cols-3 gap-6 w-full">
                  {[
                    { 
                      label: 'THREAT_INDEX', 
                      value: marketStats.totalVolume.toLocaleString(), 
                      icon: <Activity className="w-6 h-6" />,
                      color: 'text-emerald-400'
                    },
                    { 
                      label: 'SIGNAL_STRENGTH', 
                      value: `${marketStats.avgConfidence}%`, 
                      icon: <TrendingUp className="w-6 h-6" />,
                      color: 'text-sky-400'
                    },
                    { 
                      label: 'ASSET_SECURITY', 
                      value: marketStats.upPredictions, 
                      icon: <DollarSign className="w-6 h-6" />,
                      color: 'text-purple-400'
                    }
                  ].map((stat, index) => (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center mb-4">
                        <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center ${stat.color}`}>
                          {stat.icon}
                        </div>
                      </div>
                      <p className="text-emerald-400/70 font-mono text-sm tracking-wider mb-2">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Intel Feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-4 glass-card rounded-2xl relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
            <div className="p-4 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white relative">MARKET_INTEL</h2>
              </div>
              <div className="space-y-4 h-[calc(90vh-8rem)] overflow-y-auto custom-scrollbar pr-2">
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
