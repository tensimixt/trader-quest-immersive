
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, BarChart3 } from 'lucide-react';
import classNames from 'tailwind-merge';

// Define the prediction props
type PredictionCardProps = {
  symbol: string;
  prediction: 'up' | 'down';
  confidence: number;
  timestamp: string;
  traderText?: string;
  realtimePrice?: number;
  realtimeChange?: number;
  orderBookData?: {
    bids: Array<{ price: number, quantity: number }>;
    asks: Array<{ price: number, quantity: number }>;
  };
};

const PredictionCard = ({
  symbol,
  prediction,
  confidence,
  timestamp,
  traderText,
  realtimePrice,
  realtimeChange,
  orderBookData
}: PredictionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(false);

  // Styling based on prediction direction
  const cardStyle = classNames(
    "glass-card rounded-2xl p-4 border bg-black/30 backdrop-blur-sm text-white",
    prediction === 'up' 
      ? "border-emerald-500/30" 
      : "border-red-500/30"
  );

  // Format price for display
  const formatPrice = (price: number): string => {
    if (isNaN(price)) return '--';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
    // Reset order book visibility when collapsing
    if (expanded) setShowOrderBook(false);
  };

  return (
    <motion.div
      className={cardStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${prediction === 'up' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {prediction === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            )}
          </div>
          <span className="text-sm font-bold">{symbol}</span>
          {realtimePrice && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-sm font-mono">{formatPrice(realtimePrice)}</span>
              {realtimeChange !== undefined && (
                <span className={`text-xs font-mono ${realtimeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {realtimeChange >= 0 ? '+' : ''}{realtimeChange.toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {orderBookData && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowOrderBook(!showOrderBook); 
              }}
              className={`p-1 rounded hover:bg-gray-700/30 ${showOrderBook ? 'bg-gray-700/30' : ''}`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          <button 
            onClick={toggleExpanded}
            className="p-1 rounded hover:bg-gray-700/30"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400">Prediction</p>
          <p className={`text-base font-semibold ${prediction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {prediction === 'up' ? 'Long' : 'Short'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Confidence</p>
          <p className="text-base font-semibold text-amber-400">{confidence}%</p>
        </div>
      </div>

      {showOrderBook && orderBookData && (
        <div className="bg-black/30 rounded p-2 my-2 text-xs border border-gray-800">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <h4 className="font-medium text-emerald-400 mb-1">Bids</h4>
              {orderBookData.bids.map((bid, idx) => (
                <div key={`bid-${idx}`} className="flex justify-between">
                  <span className="text-emerald-400">{bid.price.toFixed(2)}</span>
                  <span className="text-gray-400">{bid.quantity.toFixed(3)}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium text-red-400 mb-1">Asks</h4>
              {orderBookData.asks.map((ask, idx) => (
                <div key={`ask-${idx}`} className="flex justify-between">
                  <span className="text-red-400">{ask.price.toFixed(2)}</span>
                  <span className="text-gray-400">{ask.quantity.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {expanded && traderText && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 text-sm text-gray-300 border-t border-gray-800 pt-2"
        >
          <p className="text-xs text-gray-400 mb-1">Analysis</p>
          <p>{traderText}</p>
          <p className="text-xs text-gray-500 mt-2">{timestamp}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PredictionCard;
