
import React, { useState, useEffect } from 'react';
import TradingGlobe from '../components/TradingGlobe';
import PredictionCard from '../components/PredictionCard';
import { motion } from 'framer-motion';

// Mock data generator
const generatePrediction = () => ({
  symbol: ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'AMZN'][Math.floor(Math.random() * 5)],
  prediction: Math.random() > 0.5 ? 'up' : 'down' as 'up' | 'down',
  confidence: Math.floor(Math.random() * 30) + 70,
  timestamp: new Date().toLocaleTimeString(),
  id: Math.random().toString(),
});

const Index = () => {
  const [predictions, setPredictions] = useState<Array<any>>([]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="text-center mb-12">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold mb-4"
          >
            Trading Insights
          </motion.h1>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600"
          >
            Real-time market predictions powered by AI
          </motion.p>
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
