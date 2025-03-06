
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TickerData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
}

interface BinanceTickersListProps {
  onClose: () => void;
}

const BinanceTickersList: React.FC<BinanceTickersListProps> = ({ onClose }) => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Filter to show only major crypto pairs against USDT
  const filterSymbols = (data: TickerData[]) => {
    const majorSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 'XRPUSDT', 'SOLUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT'];
    return data
      .filter(ticker => majorSymbols.includes(ticker.symbol))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
  };

  useEffect(() => {
    // Connect to Binance WebSocket for 24hr ticker stats
    const connectWebSocket = () => {
      setIsLoading(true);
      
      // Close existing connection if any
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }

      // Create new WebSocket connection
      wsRef.current = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
      
      wsRef.current.onopen = () => {
        console.log('Connected to Binance WebSocket');
        setIsError(false);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const filteredData = filterSymbols(data);
          setTickers(filteredData);
          setIsLoading(false);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
          setIsError(true);
          setIsLoading(false);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsError(true);
        setIsLoading(false);
        toast.error('Failed to connect to Binance data');
      };
      
      wsRef.current.onclose = () => {
        console.log('Disconnected from Binance WebSocket');
      };
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const formatPrice = (price: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(price));
  };

  const formatChange = (change: string): string => {
    const changeNum = parseFloat(change);
    return changeNum > 0 
      ? `+${changeNum.toFixed(2)}%` 
      : `${changeNum.toFixed(2)}%`;
  };

  const formatVolume = (volume: string): string => {
    const vol = parseFloat(volume);
    if (vol >= 1_000_000_000) {
      return `$${(vol / 1_000_000_000).toFixed(2)}B`;
    } else if (vol >= 1_000_000) {
      return `$${(vol / 1_000_000).toFixed(2)}M`;
    } else if (vol >= 1_000) {
      return `$${(vol / 1_000).toFixed(2)}K`;
    }
    return `$${vol.toFixed(2)}`;
  };

  const handleRefresh = () => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
      // Reconnect if not connected
      setTickers([]);
      setIsLoading(true);
      setIsError(false);
      
      // Create new WebSocket connection
      wsRef.current = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
      toast.info('Reconnecting to Binance data...');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="binance-tickers-list glass-card rounded-xl border border-emerald-500/20 p-4 relative mt-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-bold text-white font-mono tracking-wider">24HR TICKERS</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400/70 font-mono">LIVE</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh} 
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

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-6 h-6 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin" />
          <span className="ml-3 text-emerald-400">Loading tickers...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-red-400 mb-2">Failed to load ticker data</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
          >
            <RefreshCw size={16} className="mr-2" /> Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-black/20">
          {tickers.map((ticker) => (
            <motion.div
              key={ticker.symbol}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 rounded-lg border border-emerald-500/20 bg-black/40 flex justify-between items-center"
            >
              <div className="flex flex-col">
                <span className="font-mono text-sm text-emerald-400">{ticker.symbol.replace('USDT', '')}/USDT</span>
                <span className="text-xs text-emerald-400/50">Vol: {formatVolume(ticker.quoteVolume)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-sm text-white">{formatPrice(ticker.lastPrice)}</span>
                <div className="flex items-center">
                  {parseFloat(ticker.priceChangePercent) >= 0 ? (
                    <TrendingUp size={12} className="text-emerald-400 mr-1" />
                  ) : (
                    <TrendingDown size={12} className="text-red-400 mr-1" />
                  )}
                  <span className={`text-xs font-mono ${
                    parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatChange(ticker.priceChangePercent)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default BinanceTickersList;
