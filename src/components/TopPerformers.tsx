
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Info, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/performanceUtils';

type Timeframe = '24h' | '7d' | '30d';
type PerformerData = {
  symbol: string;
  price: number;
  priceChangePercent: number;
  volume: number;
};

const TopPerformers = ({ onClose }: { onClose: () => void }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [performers, setPerformers] = useState<PerformerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopPerformers();
  }, [timeframe]);

  const fetchTopPerformers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch data from Binance API via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        body: { getTopPerformers: true, timeframe }
      });

      if (error) throw new Error(error.message);
      
      if (data && Array.isArray(data)) {
        // Sort by price change percent in descending order and take top 10
        const topTen = data
          .filter(ticker => ticker.priceChangePercent && !isNaN(parseFloat(ticker.priceChangePercent)))
          .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
          .slice(0, 10)
          .map(ticker => ({
            symbol: ticker.symbol.replace('USDT', ''),
            price: parseFloat(ticker.lastPrice),
            priceChangePercent: parseFloat(ticker.priceChangePercent),
            volume: parseFloat(ticker.quoteVolume || ticker.volume)
          }));
        
        setPerformers(topTen);
      } else {
        // If we can't fetch real data, show mock data for demo
        setPerformers(getMockPerformers());
      }
    } catch (err) {
      console.error('Failed to fetch top performers:', err);
      setError('Failed to fetch data');
      toast.error('Failed to load top performers');
      // Show mock data on error
      setPerformers(getMockPerformers());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockPerformers = (): PerformerData[] => {
    // Mock data with realistic values
    return [
      { symbol: 'PEPE', price: 0.00000126, priceChangePercent: 25.4, volume: 123456789 },
      { symbol: 'SHIB', price: 0.00002341, priceChangePercent: 18.7, volume: 987654321 },
      { symbol: 'DOGE', price: 0.12345, priceChangePercent: 15.2, volume: 543216789 },
      { symbol: 'SOL', price: 142.56, priceChangePercent: 12.8, volume: 321456987 },
      { symbol: 'AVAX', price: 35.67, priceChangePercent: 10.5, volume: 234567891 },
      { symbol: 'DOT', price: 7.89, priceChangePercent: 9.3, volume: 456789123 },
      { symbol: 'LINK', price: 16.43, priceChangePercent: 8.7, volume: 345678912 },
      { symbol: 'MATIC', price: 0.67, priceChangePercent: 7.9, volume: 234156789 },
      { symbol: 'APT', price: 8.21, priceChangePercent: 6.5, volume: 123456798 },
      { symbol: 'ARB', price: 0.98, priceChangePercent: 5.8, volume: 987612345 }
    ];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="top-performers glass-card rounded-xl border border-emerald-500/20 p-4 relative"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white font-mono tracking-wider">TOP 10 PERFORMERS ({timeframe.toUpperCase()})</h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => {
              toast.info('Refreshing top performers');
              fetchTopPerformers();
            }} 
            className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            disabled={isLoading}
            title="Refresh data"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {}} // Info tooltip would go here
            className="p-1.5 rounded-lg bg-black/40 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
            title="Information"
          >
            <Info size={16} />
          </button>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {(['24h', '7d', '30d'] as Timeframe[]).map((option) => (
          <button
            key={option}
            onClick={() => setTimeframe(option)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeframe === option
                ? 'bg-emerald-500/30 text-emerald-400'
                : 'bg-black/40 text-white/70 hover:bg-emerald-500/10'
            }`}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
        {isLoading && performers.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : performers.length > 0 ? (
          <table className="w-full text-white">
            <thead className="text-emerald-400 text-xs uppercase">
              <tr>
                <th className="text-left py-2">Symbol</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Change</th>
              </tr>
            </thead>
            <tbody>
              {performers.map((performer, index) => (
                <tr 
                  key={`${performer.symbol}-${index}`}
                  className="border-b border-white/5 hover:bg-emerald-500/5 transition-colors"
                >
                  <td className="py-3 text-left font-mono">{performer.symbol}</td>
                  <td className="py-3 text-right font-mono">{formatPrice(performer.price)}</td>
                  <td className="py-3 text-right font-mono text-emerald-400">
                    +{performer.priceChangePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex justify-center items-center h-64 border border-dashed border-emerald-500/20 rounded-lg">
            <p className="text-emerald-400">No data available</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TopPerformers;
