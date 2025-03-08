
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type PerformanceData = {
  symbol: string;
  performance: number;
  priceData: Array<{
    timestamp: number;
    price: number;
  }>;
  currentPrice: number;
  isNewListing?: boolean;
  dataPoints?: number;
  expectedDataPoints?: number;
  daysCovered?: string;
}

const COLORS = [
  '#10B981', // emerald-500
  '#3B82F6', // blue-500
  '#EC4899', // pink-500
  '#8B5CF6', // violet-500
  '#F59E0B', // amber-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#14B8A6', // teal-500
  '#6366F1', // indigo-500
  '#EF4444', // red-500
];

const TopPerformersChart: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [topPerformers, setTopPerformers] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<number>(7);
  const [limit, setLimit] = useState<number>(10);
  const [normalizedData, setNormalizedData] = useState<any[]>([]);

  useEffect(() => {
    fetchTopPerformers();
  }, [timeframe, limit]);

  const fetchTopPerformers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        body: { 
          getTopPerformers: true,
          days: timeframe,
          limit: limit
        }
      });
      
      if (error) throw error;
      
      console.log('Fetched top performers:', data);
      setTopPerformers(data);
      
      // Normalize data for charting
      normalizeDataForChart(data);
      
    } catch (error) {
      console.error('Error fetching top performers:', error);
      toast.error('Failed to fetch top performers');
    } finally {
      setIsLoading(false);
    }
  };
  
  const normalizeDataForChart = (performers: PerformanceData[]) => {
    if (!performers.length) return;
    
    // First, find the earliest common timestamp
    const allTimestamps = new Set<number>();
    performers.forEach(performer => {
      performer.priceData.forEach(point => {
        allTimestamps.add(point.timestamp);
      });
    });
    
    const timestampArray = Array.from(allTimestamps).sort((a, b) => a - b);
    
    // Create normalized data points
    const normalized = timestampArray.map(timestamp => {
      const dataPoint: any = { timestamp };
      
      performers.forEach(performer => {
        const matchingPoint = performer.priceData.find(p => p.timestamp === timestamp);
        if (matchingPoint) {
          // Find the initial price for this performer
          const initialPrice = performer.priceData[0]?.price || 1;
          // Calculate percentage change from initial price
          const percentChange = ((matchingPoint.price - initialPrice) / initialPrice) * 100;
          dataPoint[performer.symbol] = percentChange;
        }
      });
      
      return dataPoint;
    });
    
    // Sort by timestamp
    const sortedData = normalized.sort((a, b) => a.timestamp - b.timestamp);
    
    // Format dates for display
    const formattedData = sortedData.map(point => {
      return {
        ...point,
        formattedDate: new Date(point.timestamp).toLocaleDateString()
      };
    });
    
    setNormalizedData(formattedData);
  };
  
  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatPrice = (price: number): string => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 1000) return `$${price.toFixed(2)}`;
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };
  
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = formatTimestamp(label);
      
      return (
        <div className="custom-tooltip bg-black/90 border border-emerald-500/30 p-2 rounded">
          <p className="text-emerald-400 font-mono text-xs">{date}</p>
          <div className="tooltip-items">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center text-xs py-1">
                <div 
                  className="w-2 h-2 rounded-full mr-1" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-white mr-2">{entry.name}:</span>
                <span 
                  className={entry.value >= 0 ? 'text-emerald-400' : 'text-red-400'}
                >
                  {formatPercentage(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="top-performers-view glass-card rounded-xl border border-emerald-500/20 p-4 relative"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white font-mono tracking-wider">
          TOP {limit} PERFORMERS ({timeframe}D)
        </h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={fetchTopPerformers} 
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
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={timeframe === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeframe(1)}
          className={timeframe === 1 ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-500/50 text-emerald-400"}
        >
          24H
        </Button>
        <Button
          variant={timeframe === 7 ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeframe(7)}
          className={timeframe === 7 ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-500/50 text-emerald-400"}
        >
          7D
        </Button>
        <Button
          variant={timeframe === 30 ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeframe(30)}
          className={timeframe === 30 ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-500/50 text-emerald-400"}
        >
          30D
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-[350px] border border-dashed border-emerald-500/20 rounded-lg">
          <div className="w-8 h-8 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : normalizedData.length > 0 ? (
        <div className="h-[350px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={normalizedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#10b98130" />
              <XAxis 
                dataKey="formattedDate" 
                stroke="#10B981" 
                tick={{ fill: '#10B981', fontSize: 12 }} 
              />
              <YAxis 
                stroke="#10B981" 
                tick={{ fill: '#10B981', fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                domain={['dataMin', 'dataMax']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {topPerformers.map((performer, index) => (
                <Line
                  key={performer.symbol}
                  type="monotone"
                  dataKey={performer.symbol}
                  name={performer.symbol.replace('USDT', '')}
                  stroke={COLORS[index % COLORS.length]}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[350px] border border-dashed border-emerald-500/20 rounded-lg text-emerald-400">
          No data available
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {topPerformers.map((performer, index) => (
          <div 
            key={performer.symbol} 
            className="bg-black/30 border border-emerald-500/10 rounded-lg p-2 flex flex-col"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-emerald-400 font-mono text-xs font-bold">
                {performer.symbol.replace('USDT', '')}
              </span>
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                {performer.isNewListing && (
                  <div className="ml-1" title={`New listing or incomplete data (${performer.daysCovered}/${timeframe} days)`}>
                    <AlertTriangle size={12} className="text-amber-400" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-white text-sm font-mono">
              {formatPrice(performer.currentPrice)}
            </span>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-mono ${performer.performance >= 0 ? 'text-emerald-400 flex items-center' : 'text-red-400 flex items-center'}`}>
                {performer.performance >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {formatPercentage(performer.performance)}
              </span>
              {performer.isNewListing && (
                <span className="text-amber-400 text-xs font-mono">
                  {performer.daysCovered}d
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TopPerformersChart;
