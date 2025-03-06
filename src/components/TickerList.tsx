import React, { useState, useEffect, useRef } from 'react';
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
  quoteVolume?: string; // Adding quoteVolume which is in USDT
};

const TickerList = ({ onClose }: { onClose: () => void }) => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const tickersMapRef = useRef<Map<string, TickerData>>(new Map());
  const updatedTickersRef = useRef<Set<string>>(new Set());

  const fetchTickers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        body: { get24hTickers: true }
      });

      if (error) throw error;
      
      data.forEach((ticker: TickerData) => {
        tickersMapRef.current.set(ticker.symbol, ticker);
      });
      
      setTickers(data);
      setLastUpdateTime(new Date());
      console.log(`Fetched ${data.length} tickers via HTTP`);
    } catch (error) {
      console.error('Failed to fetch tickers:', error);
      toast.error('Failed to fetch ticker data');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (webSocketRef.current && webSocketRef.current.readyState !== WebSocket.CLOSED) {
      webSocketRef.current.close();
    }

    try {
      const baseUrl = supabase.functions.url;
      const wsUrl = baseUrl.replace('https:', 'wss:') + '/crypto-prices';
      
      console.log('Connecting to WebSocket URL:', wsUrl);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsWebSocketConnected(true);
        toast.success('Live ticker updates connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'initial' || message.type === 'refresh') {
            const newTickers = message.data as TickerData[];
            
            tickersMapRef.current.clear();
            newTickers.forEach((ticker) => {
              tickersMapRef.current.set(ticker.symbol, ticker);
            });
            
            updatedTickersRef.current.clear();
            
            setTickers(newTickers);
            setLastUpdateTime(new Date());
            console.log(`Received ${newTickers.length} tickers via WebSocket (${message.type})`);
          } 
          else if (message.type === 'update') {
            const updatedTicker = message.data as TickerData;
            
            tickersMapRef.current.set(updatedTicker.symbol, updatedTicker);
            
            updatedTickersRef.current.add(updatedTicker.symbol);
            
            setTimeout(() => {
              updatedTickersRef.current.delete(updatedTicker.symbol);
            }, 2000);
            
            const updatedTickers = Array.from(tickersMapRef.current.values())
              .sort((a, b) => {
                const aVolume = a.quoteVolume ? parseFloat(a.quoteVolume) : parseFloat(a.volume) * parseFloat(a.lastPrice);
                const bVolume = b.quoteVolume ? parseFloat(b.quoteVolume) : parseFloat(b.volume) * parseFloat(b.lastPrice);
                return bVolume - aVolume;
              });
            
            setTickers(updatedTickers);
            setLastUpdateTime(new Date());
          }
          else if (message.type === 'error') {
            console.error('WebSocket error message:', message.message);
            toast.error(`WebSocket error: ${message.message}`);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsWebSocketConnected(false);
        
        setTimeout(() => {
          if (webSocketRef.current === ws) {
            connectWebSocket();
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error, trying to reconnect...');
        setIsWebSocketConnected(false);
      };

      webSocketRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      toast.error('Failed to establish WebSocket connection');
      setIsWebSocketConnected(false);
    }
  };

  useEffect(() => {
    fetchTickers();
    connectWebSocket();
    
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, []);

  const formatPrice = (price: string): string => {
    const numericPrice = parseFloat(price);
    
    if (numericPrice < 0.01) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 6, 
        maximumFractionDigits: 8
      }).format(numericPrice);
    }
    
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

      <div className="flex items-center justify-between mb-2">
        <div className="text-emerald-400/70 text-xs font-mono">
          {filteredTickers.length} tickers
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs text-emerald-400/70 font-mono">
            {isWebSocketConnected ? 'LIVE' : 'OFFLINE'}
          </span>
          {lastUpdateTime && (
            <span className="text-xs text-emerald-400/70 font-mono">
              Updated: {lastUpdateTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
        {isLoading && tickers.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <table className="w-full text-white">
              <thead className="text-emerald-400 text-xs uppercase">
                <tr>
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">24h Change</th>
                  <th className="text-right py-2">Volume (USDT)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickers.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-400">No tickers found</td>
                  </tr>
                ) : (
                  filteredTickers.map((ticker) => {
                    const isUpdated = updatedTickersRef.current.has(ticker.symbol);
                    
                    return (
                      <tr 
                        key={ticker.symbol} 
                        className={`border-b border-white/5 transition-colors ${
                          isUpdated ? 'bg-emerald-500/20' : 'hover:bg-emerald-500/5'
                        }`}
                      >
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
                            style: 'currency',
                            currency: 'USD',
                            notation: 'compact',
                            maximumFractionDigits: 2
                          }).format(ticker.quoteVolume ? parseFloat(ticker.quoteVolume) : parseFloat(ticker.volume) * parseFloat(ticker.lastPrice))}
                        </td>
                      </tr>
                    );
                  })
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
