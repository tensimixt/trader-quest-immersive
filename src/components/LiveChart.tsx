import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { RefreshCw, X, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const getSymbolName = (symbol: string): string => {
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

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
    ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const LiveChart = ({ symbol, onClose }: LiveChartProps) => {
  const [data, setData] = useState<KlineData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [interval, setInterval] = useState<string>('15m');
  const wsRef = useRef<WebSocket | null>(null);
  const lastFullRefreshRef = useRef<number>(Date.now());
  const dataMapRef = useRef<Map<number, KlineData>>(new Map());

  const fetchCryptoData = async () => {
    try {
      setIsLoading(true);
      const { data: responseData, error: fetchError } = await supabase.functions.invoke('crypto-prices', {
        body: { symbol, history: 'true', interval }
      });
      
      if (fetchError) throw fetchError;
      
      if (responseData.price) {
        setCurrentPrice(responseData.price);
      }
      
      if (responseData.history && responseData.history.length > 0) {
        const newDataMap = new Map<number, KlineData>();
        responseData.history.forEach((kline: KlineData) => {
          newDataMap.set(kline.timestamp, kline);
        });
        
        dataMapRef.current = newDataMap;
        
        const sortedData = Array.from(newDataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
        setData(sortedData);
      }
      
      setLastUpdated(new Date());
      lastFullRefreshRef.current = Date.now();
      setError(null);
    } catch (err) {
      console.error('Error fetching crypto data:', err);
      setError('Failed to fetch data. Please try again.');
      toast.error('Failed to load chart data');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
    
    ws.onopen = () => {
      console.log(`WebSocket connected for ${symbol}`);
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.k) {
        const kline = message.k;
        const timestamp = kline.t;
        
        setCurrentPrice(parseFloat(kline.c));
        setLastUpdated(new Date());
        
        const newKline: KlineData = {
          timestamp: timestamp,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v)
        };
        
        dataMapRef.current.set(timestamp, newKline);
        
        const now = Date.now();
        if (now - lastFullRefreshRef.current > 5 * 60 * 1000) {
          console.log("Performing full data refresh");
          fetchCryptoData();
          return;
        }
        
        setData(prevData => {
          const updatedData = Array.from(dataMapRef.current.values())
            .sort((a, b) => a.timestamp - b.timestamp);
          
          if (updatedData.length > 30) {
            return updatedData.slice(updatedData.length - 30);
          }
          
          return updatedData;
        });
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Live connection error. Trying to reconnect...');
      setTimeout(connectWebSocket, 5000);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    wsRef.current = ws;
  };

  useEffect(() => {
    fetchCryptoData();
    connectWebSocket();
    
    const refreshInterval = setInterval(() => {
      console.log("Scheduled full data refresh");
      fetchCryptoData();
    }, 5 * 60 * 1000);
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(refreshInterval);
    };
  }, [symbol, interval]);

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

  const ChartContent = ({ height }: { height: number }) => (
    <div style={{ height }} className="bg-black/40 rounded-lg p-2">
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="text-xs text-emerald-400/70 font-mono">
          Timeframe: {interval}
        </div>
        <div className="text-xs text-emerald-400/70 font-mono">
          {data.length > 0 ? 
            `${formatDate(data[0].timestamp)} - ${formatDate(data[data.length - 1].timestamp)}` : 
            'No data'}
        </div>
      </div>
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
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-emerald-400/50 font-mono">
          {isLoading ? 'Loading data...' : 'No data available'}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="live-chart glass-card rounded-xl border border-emerald-500/20 p-4 relative"
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <Maximize2 size={16} />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] bg-black/95 border-emerald-500/20">
              <div className="pt-6">
                <h3 className="text-lg font-bold text-white font-mono tracking-wider mb-4">{getSymbolName(symbol)} - {interval} Chart</h3>
                <ChartContent height={600} />
              </div>
            </DialogContent>
          </Dialog>
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
          Last update: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
      
      <ChartContent height={200} />
    </motion.div>
  );
};

export default LiveChart;
