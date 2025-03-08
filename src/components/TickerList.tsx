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

// Create a static WebSocket registry to manage all-tickers connection
const tickersWsRegistry = {
  activeConnection: null as WebSocket | null,
  connectionCount: 0,
  subscribers: new Set<(data: any) => void>(),
  
  // Get or create the singleton ticker WebSocket
  getConnection(onMessage: (data: any) => void): WebSocket {
    if (this.activeConnection && this.activeConnection.readyState === WebSocket.OPEN) {
      // Add the subscriber
      this.subscribers.add(onMessage);
      this.connectionCount++;
      console.log(`Reusing tickers WebSocket, count: ${this.connectionCount}`);
      return this.activeConnection;
    } else {
      // Create a new connection
      console.log('Creating new tickers WebSocket');
      
      // Create WebSocket connection for all tickers
      const wsUrl = 'wss://stream.binance.com:9443/ws/!ticker@arr';
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Tickers WebSocket connected');
        toast.success('Connected to ticker updates');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Dispatch to all subscribers
          this.subscribers.forEach(subscriber => subscriber(data));
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('Tickers WebSocket error:', error);
        toast.error('Connection error');
        this.activeConnection = null;
      };
      
      ws.onclose = () => {
        console.log('Tickers WebSocket disconnected');
        this.activeConnection = null;
        
        // Attempt reconnection after a delay
        setTimeout(() => {
          if (this.subscribers.size > 0 && document.visibilityState === 'visible') {
            console.log('Attempting to reconnect tickers WebSocket');
            this.getConnection(() => {
              // This is just to trigger reconnection, the actual subscribers will be re-added
            });
          }
        }, 5000);
      };
      
      // Store the new connection
      this.activeConnection = ws;
      
      // Add the subscriber
      this.subscribers.add(onMessage);
      this.connectionCount++;
      
      return ws;
    }
  },
  
  // Release a subscription
  releaseConnection(onMessage: (data: any) => void): void {
    if (this.subscribers.has(onMessage)) {
      this.subscribers.delete(onMessage);
      this.connectionCount--;
      console.log(`Released tickers WebSocket subscription, count: ${this.connectionCount}`);
      
      // If no more subscribers, close the connection
      if (this.subscribers.size === 0 && this.activeConnection) {
        console.log('No more subscribers, closing tickers WebSocket');
        this.activeConnection.close();
        this.activeConnection = null;
      }
    }
  }
};

const TickerList = ({ onClose }: { onClose: () => void }) => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  const tickersMapRef = useRef<Map<string, TickerData>>(new Map());
  const updatedTickersRef = useRef<Set<string>>(new Set());
  const isComponentMountedRef = useRef<boolean>(true);
  const webSocketRef = useRef<WebSocket | null>(null);
  const onMessageCallbackRef = useRef<(data: any) => void>(() => {});
  const screenSizeRef = useRef<string>(typeof window !== 'undefined' ? 
    window.innerWidth <= 768 ? 'mobile' : 'desktop' : 'desktop');

  const fetchTickers = async () => {
    if (!isComponentMountedRef.current) return;
    
    setIsLoading(true);
    try {
      // Fallback to HTTP for initial data
      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        body: { get24hTickers: true }
      });

      if (error) throw error;
      if (!isComponentMountedRef.current) return;
      
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
      if (isComponentMountedRef.current) {
        toast.error('Failed to fetch ticker data');
      }
    } finally {
      if (isComponentMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const connectWebSocket = () => {
    if (!isComponentMountedRef.current) return;
    
    if (webSocketRef.current) {
      // We are already connected - release the old callback
      tickersWsRegistry.releaseConnection(onMessageCallbackRef.current);
    }
    
    try {
      // Create a message handler
      const onMessage = (data: any) => {
        if (!isComponentMountedRef.current) return;
        
        if (Array.isArray(data)) {
          // Process the data into our ticker format
          data.forEach((ticker) => {
            if (ticker.s && ticker.s.endsWith('USDT')) {
              const tickerData: TickerData = {
                symbol: ticker.s,
                priceChange: ticker.p || '0',
                priceChangePercent: ticker.P || '0',
                lastPrice: ticker.c || '0',
                volume: ticker.v || '0',
                quoteVolume: ticker.q || '0'
              };
              
              tickersMapRef.current.set(tickerData.symbol, tickerData);
              updatedTickersRef.current.add(tickerData.symbol);
              
              // Clear the highlight after 2 seconds
              setTimeout(() => {
                if (isComponentMountedRef.current) {
                  updatedTickersRef.current.delete(tickerData.symbol);
                }
              }, 2000);
            }
          });
          
          // Update state with sorted tickers
          if (isComponentMountedRef.current) {
            const sortedTickers = Array.from(tickersMapRef.current.values())
              .filter(ticker => ticker.symbol.endsWith('USDT'))
              .sort((a, b) => {
                const aVolume = a.quoteVolume ? parseFloat(a.quoteVolume) : parseFloat(a.volume) * parseFloat(a.lastPrice);
                const bVolume = b.quoteVolume ? parseFloat(b.quoteVolume) : parseFloat(b.volume) * parseFloat(b.lastPrice);
                return bVolume - aVolume;
              });
            
            setTickers(sortedTickers);
            setLastUpdateTime(new Date());
          }
        }
      };
      
      // Store the callback in the ref so we can release it later
      onMessageCallbackRef.current = onMessage;
      
      // Get a connection from the registry
      webSocketRef.current = tickersWsRegistry.getConnection(onMessage);
      
      setIsWebSocketConnected(true);
      
    } catch (error) {
      console.error('Error setting up WebSocket connection for tickers:', error);
      if (isComponentMountedRef.current) {
        toast.error('Failed to establish WebSocket connection');
        setIsWebSocketConnected(false);
      }
    }
  };

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      const newScreenSize = window.innerWidth <= 768 ? 'mobile' : 'desktop';
      if (screenSizeRef.current !== newScreenSize) {
        console.log(`Screen size changed from ${screenSizeRef.current} to ${newScreenSize}`);
        screenSizeRef.current = newScreenSize;
        
        // If WebSocket is connected, reconnect it
        if (isWebSocketConnected) {
          // Clean up and reconnect after a small delay
          if (webSocketRef.current) {
            tickersWsRegistry.releaseConnection(onMessageCallbackRef.current);
            webSocketRef.current = null;
          }
          
          setIsWebSocketConnected(false);
          
          setTimeout(() => {
            if (isComponentMountedRef.current) {
              connectWebSocket();
            }
          }, 300);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isWebSocketConnected]);

  useEffect(() => {
    isComponentMountedRef.current = true;
    
    // First fetch data via HTTP
    fetchTickers().then(() => {
      // Then attempt WebSocket connection
      const timeoutId = setTimeout(() => {
        if (isComponentMountedRef.current) {
          connectWebSocket();
        }
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    });
    
    return () => {
      isComponentMountedRef.current = false;
      
      if (webSocketRef.current) {
        tickersWsRegistry.releaseConnection(onMessageCallbackRef.current);
        webSocketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let httpUpdateInterval: NodeJS.Timeout;
    
    // If WebSocket is not connected, fall back to HTTP updates
    if (!isWebSocketConnected && tickers.length > 0) {
      httpUpdateInterval = setInterval(() => {
        if (isComponentMountedRef.current) {
          fetchTickers();
        }
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
