
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatPrice, formatPercentage } from '@/utils/performanceUtils';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TokenDetailChartProps {
  symbol: string;
  interval: string;
  timeframe: number;
}

const TokenDetailChart: React.FC<TokenDetailChartProps> = ({ symbol, interval, timeframe }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTokenData();
  }, [symbol, interval, timeframe]);

  const fetchTokenData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Fetching data for ${symbol} with interval ${interval}`);
      
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('crypto-prices', {
        body: { 
          symbol,
          history: true,
          interval: timeframe <= 1 ? '1h' : '1d',
          limit: timeframe
        }
      });
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      if (responseData && responseData.history && responseData.history.length > 0) {
        const formattedData = responseData.history.map((kline: any) => ({
          timestamp: kline.timestamp,
          formattedDate: new Date(kline.timestamp).toLocaleDateString(),
          open: kline.open,
          high: kline.high,
          low: kline.low,
          close: kline.close,
          volume: kline.volume
        }));
        
        setChartData(formattedData);
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error('Error fetching token data:', err);
      setError('Failed to fetch price data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return timeframe <= 1 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="custom-tooltip bg-black/90 border border-emerald-500/30 p-2 rounded">
          <p className="text-emerald-400 font-mono text-xs">{formatTimestamp(label)}</p>
          <div className="tooltip-items space-y-1 mt-1">
            <div className="flex justify-between text-xs">
              <span className="text-white mr-2">Open:</span>
              <span className="text-emerald-400">{formatPrice(data.open)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white mr-2">High:</span>
              <span className="text-emerald-400">{formatPrice(data.high)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white mr-2">Low:</span>
              <span className="text-emerald-400">{formatPrice(data.low)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white mr-2">Close:</span>
              <span className="text-emerald-400">{formatPrice(data.close)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white mr-2">Volume:</span>
              <span className="text-emerald-400">{data.volume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[350px] border border-dashed border-emerald-500/20 rounded-lg">
        <div className="flex flex-col items-center">
          <RefreshCw size={24} className="text-emerald-400 animate-spin mb-2" />
          <span className="text-emerald-400 text-sm">Loading {symbol} data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[350px] border border-dashed border-red-500/20 rounded-lg">
        <div className="text-red-400 text-center p-4">
          <p>{error}</p>
          <button 
            onClick={fetchTokenData}
            className="mt-2 px-3 py-1 bg-red-500/20 rounded-md text-red-400 hover:bg-red-500/30 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] border border-dashed border-emerald-500/20 rounded-lg">
        <div className="text-emerald-400 text-center">
          <p>No data available for {symbol}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[350px] bg-black/30 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.1)" />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            stroke="#10B981" 
            tick={{ fill: '#10B981', fontSize: 12 }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            stroke="#10B981"
            tick={{ fill: '#10B981', fontSize: 12 }}
            tickFormatter={(value) => formatPrice(value)}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
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
    </div>
  );
};

export default TokenDetailChart;
