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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const fetchTickers = async () => {
    setIsLoading(true);
    try {
      // Fallback to HTTP for initial data
      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        body: { get24hTickers: true }
      });

      if (error) throw error;
      
      if (data && Array.isArray(data)) {
        data.forEach((ticker: TickerData) => {
          tickersMapRef.current.set(ticker.symbol, ticker);
        });
        
        setTickers(data);
        setLastUpdateTime(new Date());
        console.log(`Fetched ${data.length} tickers via HTTP`);
      } else {
        console.error('Invalid data format received:', data);
        toast.error('Received invalid ticker data format');
      }
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
      // Connect directly to Binance WebSocket for all USDT ticker updates
      const wsUrl = 'wss://stream.binance.com:9443/ws/!ticker@arr';
      
      console.log('Connecting to Binance WebSocket URL:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;

      ws.onopen = () => {
        console.log('Binance WebSocket connected successfully');
        setIsWebSocketConnected(true);
        toast.success('Live ticker updates connected');
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const tickerData = JSON.parse(event.data);
          
          if (Array.isArray(tickerData)) {
            // Process ticker array updates
            const usdtTickers = tickerData.filter(ticker => 
              ticker.s && ticker.s.endsWith('USDT')
            );
            
            let updated = false;
            
            usdtTickers.forEach(ticker => {
              const formattedTicker: TickerData = {
                symbol: ticker.s,
                priceChange: ticker.p,
                priceChangePercent: ticker.P,
                lastPrice: ticker.c,
                volume: ticker.v,
                quoteVolume: ticker.q  // Quote volume in USDT
              };
              
              tickersMapRef.current.set(formattedTicker.symbol, formattedTicker);
              updatedTickersRef.current.add(formattedTicker.symbol);
              
              // Clear the highlight after 2 seconds
              setTimeout(() => {
                updatedTickersRef.current.delete(formattedTicker.symbol);
              }, 2000);
              
              updated = true;
            });
            
            if (updated) {
              // Sort tickers by volume and update state
              const updatedTickers = Array.from(tickersMapRef.current.values())
                .sort((a, b) => {
                  const aVolume = a.quoteVolume ? parseFloat(a.quoteVolume) : parseFloat(a.volume) * parseFloat(a.lastPrice);
                  const bVolume = b.quoteVolume ? parseFloat(b.quoteVolume) : parseFloat(b.volume) * parseFloat(b.lastPrice);
                  return bVolume - aVolume;
                });
              
              setTickers(updatedTickers);
              setLastUpdateTime(new Date());
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsWebSocketConnected(false);
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (document.visibilityState === 'visible') {
              connectWebSocket();
            }
          }, delay);
        } else {
          console.log('Maximum reconnection attempts reached');
          toast.error('Connection lost, falling back to manual updates');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error, trying to reconnect...');
        setIsWebSocketConnected(false);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      toast.error('Failed to establish WebSocket connection');
      setIsWebSocketConnected(false);
    }
  };

  useEffect(() => {
    // First fetch data via HTTP
    fetchTickers().then(() => {
      // Then attempt WebSocket connection
      const timeoutId = setTimeout(() => {
        connectWebSocket();
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    });
    
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let httpUpdateInterval: NodeJS.Timeout;
    
    // If WebSocket is not connected, fall back to HTTP updates
    if (!isWebSocketConnected && tickers.length > 0) {
      httpUpdateInterval = setInterval(() => {
        fetchTickers();
      }, 15000); // Every 15 seconds
    }
    
    return () => {
      if (httpUpdateInterval) {
        clearInterval(httpUpdateInterval);
      }
    };
  }, [isWebSocketConnected, tickers.length]);

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
            onClick={isWebSocketConnected ? fetchTickers : connectWebSocket} 
            className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            disabled={isLoading}
            title={isWebSocketConnected ? "Refresh data" : "Connect WebSocket"}
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
