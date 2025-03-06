
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type TickerData = {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
};

const TickerList = ({ onClose }: { onClose: () => void }) => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const fetchTickers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        body: { get24hTickers: true }
      });

      if (error) throw error;
      setTickers(data);
      console.log(`Fetched ${data.length} tickers`);
    } catch (error) {
      console.error('Failed to fetch tickers:', error);
      toast.error('Failed to fetch ticker data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickers();
    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(fetchTickers, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const formatPrice = (price: string): string => {
    const numericPrice = parseFloat(price);
    
    // For very small numbers (less than 0.01), use more decimal places
    if (numericPrice < 0.01) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 6, 
        maximumFractionDigits: 8
      }).format(numericPrice);
    }
    
    // For larger numbers, use standard formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(numericPrice);
  };

  const filteredTickers = tickers.filter(ticker => 
    ticker.symbol.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="ticker-list glass-card rounded-xl border border-emerald-500/20 p-4 relative"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white font-mono tracking-wider">BINANCE TICKERS</h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={fetchTickers} 
            className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search symbols..."
          className="w-full bg-black/40 border border-emerald-500/20 rounded-lg p-2 text-white"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
        {isLoading && tickers.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-2 text-emerald-400/70 text-xs font-mono">
              {filteredTickers.length} tickers
            </div>
            <table className="w-full text-white">
              <thead className="text-emerald-400 text-xs uppercase">
                <tr>
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">24h Change</th>
                  <th className="text-right py-2">Volume</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickers.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-400">No tickers found</td>
                  </tr>
                ) : (
                  filteredTickers.map((ticker) => (
                    <tr key={ticker.symbol} className="border-b border-white/5 hover:bg-emerald-500/5 transition-colors">
                      <td className="py-3 text-left font-mono">{ticker.symbol}</td>
                      <td className="py-3 text-right font-mono">{formatPrice(ticker.lastPrice)}</td>
                      <td className={`py-3 text-right font-mono flex items-center justify-end ${
                        parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {parseFloat(ticker.priceChangePercent) >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {parseFloat(ticker.priceChangePercent).toFixed(2)}%
                      </td>
                      <td className="py-3 text-right font-mono">
                        {new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          maximumFractionDigits: 2
                        }).format(parseFloat(ticker.volume))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default TickerList;
