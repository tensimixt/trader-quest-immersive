
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bitcoin, Coins, BarChart2, RefreshCw, X, TrendingUp, TrendingDown } from 'lucide-react';
import LiveChart from './LiveChart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CryptoChartsView = ({ onClose }: { onClose: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [prices, setPrices] = useState<{[key: string]: number}>({
    'BTCUSDT': 0,
    'ETHUSDT': 0,
    'BNBUSDT': 0,
  });
  const [changes, setChanges] = useState<{[key: string]: number}>({
    'BTCUSDT': 0,
    'ETHUSDT': 0,
    'BNBUSDT': 0,
  });
  const [previousPrices, setPreviousPrices] = useState<{[key: string]: number}>({});

  const refreshPrices = async () => {
    setIsLoading(true);
    try {
      const { data: pricesData, error: pricesError } = await supabase.functions.invoke('crypto-prices');
      
      if (pricesError) throw pricesError;

      // Save previous prices to calculate changes
      setPreviousPrices({...prices});
      
      const newPrices = pricesData.reduce((acc, curr) => ({
        ...acc,
        [curr.symbol]: curr.price
      }), {});
      
      // Calculate price changes
      const newChanges = Object.keys(newPrices).reduce((acc, symbol) => {
        const previousPrice = previousPrices[symbol] || prices[symbol];
        if (!previousPrice) return {...acc, [symbol]: 0};
        
        const change = ((newPrices[symbol] - previousPrice) / previousPrice) * 100;
        return {...acc, [symbol]: change};
      }, {});
      
      setPrices(newPrices);
      setChanges(newChanges);
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      toast.error('Failed to fetch crypto prices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPrices();
    const interval = setInterval(refreshPrices, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number): string => {
    return change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  };

  const getIconForSymbol = (symbol: string) => {
    switch (symbol) {
      case 'BTCUSDT':
        return <Bitcoin className="w-5 h-5" />;
      case 'ETHUSDT':
        return <Coins className="w-5 h-5" />;
      case 'BNBUSDT':
        return <BarChart2 className="w-5 h-5" />;
      default:
        return <BarChart2 className="w-5 h-5" />;
    }
  };

  const getNameForSymbol = (symbol: string): string => {
    switch (symbol) {
      case 'BTCUSDT':
        return 'Bitcoin';
      case 'ETHUSDT':
        return 'Ethereum';
      case 'BNBUSDT':
        return 'Binance Coin';
      default:
        return symbol;
    }
  };

  const handleSymbolSelect = (symbol: string) => {
    setActiveSymbol(symbol === activeSymbol ? null : symbol);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="crypto-charts-view glass-card rounded-xl border border-emerald-500/20 p-4 relative"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-bold text-white font-mono tracking-wider">CRYPTO_MARKETS</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400/70 font-mono">LIVE</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={refreshPrices} 
            className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {/* Crypto Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {['BTCUSDT', 'ETHUSDT', 'BNBUSDT'].map((symbol) => (
          <motion.div
            key={symbol}
            className={`crypto-card p-4 rounded-lg border ${
              activeSymbol === symbol ? 'border-emerald-500' : 'border-emerald-500/20'
            } bg-black/40 cursor-pointer hover:bg-black/60 transition-colors`}
            onClick={() => handleSymbolSelect(symbol)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="text-emerald-400">
                  {getIconForSymbol(symbol)}
                </div>
                <span className="font-mono text-sm text-emerald-400">{getNameForSymbol(symbol)}</span>
              </div>
              <div className="flex items-center space-x-1">
                {isNaN(changes[symbol]) ? null : changes[symbol] >= 0 ? (
                  <TrendingUp size={16} className="text-emerald-400" />
                ) : (
                  <TrendingDown size={16} className="text-red-400" />
                )}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold text-white font-mono">{formatPrice(prices[symbol])}</span>
              <span className={`text-sm font-mono ${
                isNaN(changes[symbol]) ? 'text-emerald-400/50' : 
                changes[symbol] >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isNaN(changes[symbol]) ? '--' : formatChange(changes[symbol])}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Active Symbol Chart */}
      <AnimatePresence>
        {activeSymbol && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LiveChart 
              symbol={activeSymbol} 
              onClose={() => setActiveSymbol(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CryptoChartsView;
