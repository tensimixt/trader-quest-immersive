
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { RefreshCw, X, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LiveChartProps {
  symbol: string;
  onClose: () => void;
}

interface PriceData {
  timestamp: number;
  price: number;
}

interface KlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const LiveChart = ({ symbol, onClose }: LiveChartProps) => {
  const [data, setData] = useState<KlineData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchCryptoData = async () => {
    try {
      setIsLoading(true);
      // According to Supabase SDK, we should pass parameters in the body property
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('crypto-prices', {
        body: { symbol, history: 'true' }
      });
      
      if (fetchError) throw fetchError;
      
      if (responseData.price) {
        setCurrentPrice(responseData.price);
      }
      
      if (responseData.history && responseData.history.length > 0) {
        setData(responseData.history);
      }
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching crypto data:', err);
      setError('Failed to fetch data. Please try again.');
      toast.error('Failed to load chart data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    
    const interval = setInterval(fetchCryptoData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [symbol]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getPriceChange = () => {
    if (data.length < 2) return 0;
    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  };

  const priceChange = getPriceChange();
  const price = currentPrice ?? (data.length > 0 ? data[data.length - 1].close : 0);

  const chartHeight = isExpanded ? 400 : 200;
  
  const getSymbolName = (ticker: string) => {
    switch (ticker) {
      case 'BTCUSDT': return 'Bitcoin';
      case 'ETHUSDT': return 'Ethereum';
      case 'BNBUSDT': return 'Binance Coin';
      default: return ticker;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`live-chart glass-card rounded-xl border border-emerald-500/20 p-4 ${
        isExpanded ? 'fixed inset-4 z-50 overflow-auto' : 'relative'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-bold text-white font-mono tracking-wider">{getSymbolName(symbol)} LIVE</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400/70 font-mono">LIVE</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button 
            onClick={fetchCryptoData} 
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
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-2xl font-bold text-white font-mono">{formatPrice(price)}</span>
          <div className="flex items-center mt-1">
            <span className={`text-sm font-mono ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-xs text-emerald-400/70 font-mono">
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
      
      <div style={{ height: chartHeight }} className="bg-black/40 rounded-lg p-2">
        {error ? (
          <div className="h-full flex items-center justify-center text-red-400 font-mono">
            {error}
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.1)" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#10B981" 
                tick={{ fill: '#10B981', fontSize: 10 }}
                axisLine={{ stroke: '#10B981', strokeWidth: 1 }}
              />
              <YAxis 
                domain={['auto', 'auto']}
                stroke="#10B981"
                tick={{ fill: '#10B981', fontSize: 10 }}
                tickFormatter={(value) => value.toFixed(0)}
                width={40}
              />
              <Tooltip 
                formatter={(value: number) => [formatPrice(value), 'Price']}
                labelFormatter={formatTime}
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.9)', 
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  color: '#10B981'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#10B981" 
                dot={false}
                strokeWidth={2}
                activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 1, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-emerald-400/50 font-mono">
            {isLoading ? 'Loading data...' : 'No data available'}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveChart;
