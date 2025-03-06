import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { RefreshCw, X, Maximize2, Minimize2 } from 'lucide-react';

interface LiveChartProps {
  symbol: string;
  onClose: () => void;
}

interface PriceData {
  timestamp: string;
  price: number;
}

const LiveChart = ({ symbol, onClose }: LiveChartProps) => {
  const [data, setData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchCryptoData = async () => {
    try {
      setIsLoading(true);
      // In a real app, you would call a crypto API here
      // For demo purposes, we'll generate random data
      const now = new Date();
      const basePrice = symbol === 'BTC/USD' ? 65000 : symbol === 'ETH/USD' ? 3500 : 450;
      const randomFactor = 0.01; // 1% variance
      
      // Generate new data point
      const newDataPoint = {
        timestamp: now.toISOString(),
        price: basePrice * (1 + (Math.random() * 2 - 1) * randomFactor)
      };
      
      // Update the data, keeping a moving window of the last 20 points
      setData(prevData => {
        const newData = [...prevData, newDataPoint];
        return newData.slice(-20);
      });
      
      setLastUpdated(now);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching crypto data:', err);
      setError('Failed to fetch data. Please try again.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchCryptoData();
    
    // Set up interval for real-time updates
    const interval = setInterval(fetchCryptoData, 5000);
    
    // Clean up interval on unmount
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

  // For displaying the time in chart tooltip
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Calculate price change percentage
  const getPriceChange = () => {
    if (data.length < 2) return 0;
    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  };

  const priceChange = getPriceChange();
  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;

  const chartHeight = isExpanded ? 400 : 200;
  
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-bold text-white font-mono tracking-wider">{symbol} LIVE</h3>
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
      
      {/* Price Information */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-2xl font-bold text-white font-mono">{formatPrice(currentPrice)}</span>
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
      
      {/* Chart */}
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
                dataKey="price" 
                stroke="#10B981" 
                dot={false}
                strokeWidth={2}
                activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 1, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-emerald-400/50 font-mono">
            Loading data...
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveChart;
