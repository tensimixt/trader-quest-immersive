
import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bitcoin, Coins, BarChart2, RefreshCw, X, TrendingUp, TrendingDown, BarChart, List, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatPrice, formatPercentage } from '@/utils/performanceUtils';

const LiveChart = lazy(() => import('./LiveChart'));
const TickerList = lazy(() => import('./TickerList'));
const TopPerformersChart = lazy(() => import('./TopPerformersChart'));

const priceWsRegistry = {
  activeConnection: null as WebSocket | null,
  connectionCount: 0,
  subscribers: new Set<(data: any) => void>(),
  
  getConnection(onMessage: (data: any) => void): WebSocket {
    if (this.activeConnection && this.activeConnection.readyState === WebSocket.OPEN) {
      this.subscribers.add(onMessage);
      this.connectionCount++;
      console.log(`Reusing price WebSocket, count: ${this.connectionCount}`);
      return this.activeConnection;
    } else {
      console.log('Creating new price WebSocket');
      
      const wsUrl = 'wss://stream.binance.com:9443/ws/!miniTicker@arr';
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Price WebSocket connected');
        toast.success('Connected to price updates');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.subscribers.forEach(subscriber => subscriber(data));
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('Price WebSocket error:', error);
        toast.error('Connection error');
        this.activeConnection = null;
      };
      
      ws.onclose = () => {
        console.log('Price WebSocket disconnected');
        this.activeConnection = null;
        
        setTimeout(() => {
          if (this.subscribers.size > 0 && document.visibilityState === 'visible') {
            console.log('Attempting to reconnect price WebSocket');
            this.getConnection((data) => {
              // This is just to trigger reconnection, the actual subscribers will be re-added
            });
          }
        }, 5000);
      };
      
      this.activeConnection = ws;
      
      this.subscribers.add(onMessage);
      this.connectionCount++;
      
      return ws;
    }
  },
  
  releaseConnection(onMessage: (data: any) => void): void {
    if (this.subscribers.has(onMessage)) {
      this.subscribers.delete(onMessage);
      this.connectionCount--;
      console.log(`Released price WebSocket subscription, count: ${this.connectionCount}`);
      
      if (this.subscribers.size === 0 && this.activeConnection) {
        console.log('No more subscribers, closing price WebSocket');
        this.activeConnection.close();
        this.activeConnection = null;
      }
    }
  }
};

type TickerStreamData = {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Price change
  P: string; // Price change percent
  c: string; // Last price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
};

const CryptoChartsView = ({ onClose }: { onClose: () => void }) => {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [prices, setPrices] = useState<{[key: string]: number}>({
    'BTCUSDT': 0,
    'ETHUSDT': 0,
    'BNBUSDT': 0,
  });
  const [changes, setChanges] = useState<{[key: string]: number}>({
    'BTCUSDT': 0,
    'ETHUSDT': 0,
    'BNBUSDT': 0,
  });
  const [previousPrices, setPreviousPrices] = useState<{[key: string]: number}>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [liveChartKey, setLiveChartKey] = useState<string>('initial');
  const [showTickerList, setShowTickerList] = useState(false);
  const [showTopPerformers, setShowTopPerformers] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [priceChangeDirection, setPriceChangeDirection] = useState<{[key: string]: 'up' | 'down' | null}>({
    'BTCUSDT': null,
    'ETHUSDT': null,
    'BNBUSDT': null,
  });
  
  const isComponentMountedRef = useRef<boolean>(true);
  const trackingSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  const onMessageCallbackRef = useRef<(data: any) => void>(() => {});
  const webSocketRef = useRef<WebSocket | null>(null);
  const screenSizeRef = useRef<string>(typeof window !== 'undefined' ? 
    window.innerWidth <= 768 ? 'mobile' : 'desktop' : 'desktop');
  const flashTimeoutsRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  const initialDataFetchedRef = useRef<{[key: string]: boolean}>({
    'BTCUSDT': false,
    'ETHUSDT': false,
    'BNBUSDT': false
  });

  const fetchInitialPrices = async () => {
    if (!isComponentMountedRef.current) return;
    
    setIsLoading(true);
    try {
      const { data: pricesData, error: pricesError } = await supabase.functions.invoke('crypto-prices');
      
      if (pricesError) throw pricesError;
      if (!isComponentMountedRef.current) return;

      console.log('Initial prices fetched via HTTP:', pricesData);
      
      const newPrices = pricesData.reduce((acc, curr) => {
        // Mark this symbol as having initial data
        initialDataFetchedRef.current[curr.symbol] = true;
        return {
          ...acc,
          [curr.symbol]: curr.price
        };
      }, {});
      
      // Only update non-zero values to prevent overwriting with zeros
      const validNewPrices = Object.entries(newPrices).reduce((acc, [symbol, price]) => {
        if (price && price > 0) {
          acc[symbol] = price;
        }
        return acc;
      }, {} as {[key: string]: number});
      
      // Only update if we have valid prices
      if (Object.keys(validNewPrices).length > 0) {
        setPrices(prev => ({...prev, ...validNewPrices}));
      }
      
      try {
        const { data: tickersData, error: tickersError } = await supabase.functions.invoke('crypto-prices', {
          body: { get24hTickers: true }
        });
        
        if (!tickersError && tickersData && isComponentMountedRef.current) {
          const changeData = {};
          tickersData.forEach(ticker => {
            if (ticker.symbol && ticker.priceChangePercent) {
              const percentChange = parseFloat(ticker.priceChangePercent);
              if (!isNaN(percentChange)) {
                changeData[ticker.symbol] = percentChange;
              }
            }
          });
          
          // Only update non-zero values or specifically zero values from valid data
          if (Object.keys(changeData).length > 0) {
            setChanges(prev => ({...prev, ...changeData}));
          }
          
          console.log('Initial changes fetched:', changeData);
        }
      } catch (err) {
        console.error('Failed to fetch ticker changes:', err);
      }
      
      if (isComponentMountedRef.current && !isInitialized) {
        setIsInitialized(true);
      }
      
    } catch (error) {
      console.error('Failed to fetch initial crypto prices:', error);
      if (isComponentMountedRef.current) {
        toast.error('Failed to load initial prices');
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
      priceWsRegistry.releaseConnection(onMessageCallbackRef.current);
    }
    
    setWsConnected(false);
    setIsLoading(true);
    
    try {
      const onMessage = (data: any) => {
        if (!isComponentMountedRef.current) return;
        
        if (Array.isArray(data)) {
          const updatedPrices = { ...prices };
          let pricesUpdated = false;
          const newDirections: {[key: string]: 'up' | 'down' | null} = { ...priceChangeDirection };
          
          data.forEach((ticker: any) => {
            const symbol = ticker.s;
            if (trackingSymbols.includes(symbol)) {
              const price = parseFloat(ticker.c);
              
              // Only update if price is valid and not zero
              if (!isNaN(price) && price > 0) {
                if (prices[symbol] > 0) {
                  newDirections[symbol] = price > prices[symbol] ? 'up' : 'down';
                  
                  if (flashTimeoutsRef.current[symbol]) {
                    clearTimeout(flashTimeoutsRef.current[symbol]);
                  }
                  
                  flashTimeoutsRef.current[symbol] = setTimeout(() => {
                    if (isComponentMountedRef.current) {
                      setPriceChangeDirection(prev => ({
                        ...prev,
                        [symbol]: null
                      }));
                    }
                  }, 2000);
                }
                
                // Mark this symbol as having data
                initialDataFetchedRef.current[symbol] = true;
                
                updatedPrices[symbol] = price;
                pricesUpdated = true;
                
                // Calculate 24h percent change if we have previous price data
                if (previousPrices[symbol] && previousPrices[symbol] > 0) {
                  const change = ((price - previousPrices[symbol]) / previousPrices[symbol]) * 100;
                  setChanges(prev => ({
                    ...prev,
                    [symbol]: change
                  }));
                }
              }
            }
          });
          
          if (pricesUpdated && isComponentMountedRef.current) {
            // Store current prices as previous before updating
            setPreviousPrices(prices);
            setPrices(updatedPrices);
            setPriceChangeDirection(newDirections);
          }
        }
      };
      
      onMessageCallbackRef.current = onMessage;
      
      webSocketRef.current = priceWsRegistry.getConnection(onMessage);
      
      setWsConnected(true);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      if (isComponentMountedRef.current) {
        setWsConnected(false);
        setIsLoading(false);
        fetchInitialPrices();
      }
    }
  };

  const refreshPrices = async () => {
    if (!isComponentMountedRef.current) return;
    
    setIsLoading(true);
    try {
      const { data: pricesData, error: pricesError } = await supabase.functions.invoke('crypto-prices');
      
      if (pricesError) throw pricesError;
      if (!isComponentMountedRef.current) return;

      // Store current prices before updating
      const currentPrices = {...prices};
      setPreviousPrices(currentPrices);
      
      const newPrices = pricesData.reduce((acc, curr) => {
        // Only update if we have a valid price
        if (curr.price && curr.price > 0) {
          acc[curr.symbol] = curr.price;
          // Mark as having initial data
          initialDataFetchedRef.current[curr.symbol] = true;
        }
        return acc;
      }, {} as {[key: string]: number});
      
      // Only update if we have valid prices
      if (Object.keys(newPrices).length > 0) {
        setPrices(prev => ({...prev, ...newPrices}));
      }
      
      const newChanges = Object.keys(newPrices).reduce((acc, symbol) => {
        const previousPrice = previousPrices[symbol] || currentPrices[symbol];
        if (!previousPrice || previousPrice <= 0) return acc;
        
        const change = ((newPrices[symbol] - previousPrice) / previousPrice) * 100;
        if (!isNaN(change)) {
          acc[symbol] = change;
        }
        return acc;
      }, {} as {[key: string]: number});
      
      // Only update if we have valid changes
      if (Object.keys(newChanges).length > 0) {
        setChanges(prev => ({...prev, ...newChanges}));
      }
      
      if (!isInitialized && isComponentMountedRef.current) {
        setIsInitialized(true);
      }
      
      toast.success('Prices updated');
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      if (isComponentMountedRef.current) {
        toast.error('Failed to fetch crypto prices');
      }
    } finally {
      if (isComponentMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const newScreenSize = window.innerWidth <= 768 ? 'mobile' : 'desktop';
      if (screenSizeRef.current !== newScreenSize) {
        console.log(`Screen size changed from ${screenSizeRef.current} to ${newScreenSize}`);
        screenSizeRef.current = newScreenSize;
        
        if (wsConnected) {
          if (webSocketRef.current) {
            priceWsRegistry.releaseConnection(onMessageCallbackRef.current);
            webSocketRef.current = null;
          }
          
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
  }, [wsConnected]);

  useEffect(() => {
    isComponentMountedRef.current = true;
    
    fetchInitialPrices().then(() => {
      const timeoutId = setTimeout(() => {
        if (isComponentMountedRef.current) {
          connectWebSocket();
        }
      }, isMobile ? 300 : 0);
      
      return () => {
        clearTimeout(timeoutId);
      };
    });
    
    return () => {
      isComponentMountedRef.current = false;
      
      Object.values(flashTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      
      if (webSocketRef.current) {
        priceWsRegistry.releaseConnection(onMessageCallbackRef.current);
        webSocketRef.current = null;
      }
    };
  }, [isMobile]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
          console.log('Page became visible, reconnecting WebSocket');
          connectWebSocket();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isInitialized && !wsConnected) {
      console.log('WebSocket not connected, falling back to HTTP updates');
      interval = setInterval(() => {
        if (isComponentMountedRef.current) {
          refreshPrices();
        }
      }, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [wsConnected, isInitialized]);

  const formatPrice = (price: number): string => {
    if (isNaN(price) || price === 0) return "$0.00";
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number): string => {
    if (isNaN(change)) return "0.00%";
    return change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  };

  const getIconForSymbol = (symbol: string) => {
    switch (symbol) {
      case 'BTCUSDT':
        return <Bitcoin className="w-5 h-5" />;
      case 'ETHUSDT':
        return <Coins className="w-5 h-5" />;
      case 'BNBUSDT':
        return <BarChart2 className="w-5 h-5" />;
      default:
        return <BarChart2 className="w-5 h-5" />;
    }
  };

  const getNameForSymbol = (symbol: string): string => {
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

  const handleSymbolSelect = (symbol: string) => {
    if (symbol === activeSymbol) {
      setActiveSymbol(null);
    } else {
      setActiveSymbol(symbol);
      setLiveChartKey(`${symbol}-${Date.now()}`);
    }
  };

  const getPriceHighlightClass = (symbol: string): string => {
    if (!priceChangeDirection[symbol]) return '';
    
    return priceChangeDirection[symbol] === 'up' 
      ? 'flash-update-positive' 
      : 'flash-update-negative';
  };

  const handleShowTopPerformers = () => {
    setShowTopPerformers(true);
    setShowTickerList(false);
  };

  const handleShowTickerList = () => {
    setShowTickerList(true);
    setShowTopPerformers(false);
  };

  // Check if a particular symbol has data loaded
  const hasSymbolData = (symbol: string): boolean => {
    return initialDataFetchedRef.current[symbol] && prices[symbol] > 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="crypto-charts-view glass-card rounded-xl border border-emerald-500/20 p-4 relative"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-bold text-white font-mono tracking-wider">MARKETS</h3>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-emerald-400/70 font-mono">
              {wsConnected ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleShowTopPerformers} 
            className={`p-1.5 rounded-lg ${showTopPerformers ? 'bg-emerald-500/30' : 'bg-black/40'} text-emerald-400 hover:bg-emerald-500/20 transition-colors`}
            title="Show top performers"
          >
            <Award size={16} />
          </button>
          <button 
            onClick={handleShowTickerList} 
            className={`p-1.5 rounded-lg ${showTickerList ? 'bg-emerald-500/30' : 'bg-black/40'} text-emerald-400 hover:bg-emerald-500/20 transition-colors`}
            title="Show all tickers"
          >
            <List size={16} />
          </button>
          <button 
            onClick={wsConnected ? refreshPrices : connectWebSocket} 
            className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            disabled={isLoading}
            title={wsConnected ? "Refresh data" : "Connect"}
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
      
      <AnimatePresence mode="wait">
        {showTopPerformers ? (
          <motion.div
            key="top-performers"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-40 border border-dashed border-emerald-500/20 rounded-lg">
                <div className="w-6 h-6 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            }>
              <TopPerformersChart onClose={() => setShowTopPerformers(false)} />
            </Suspense>
          </motion.div>
        ) : showTickerList ? (
          <motion.div
            key="ticker-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-40 border border-dashed border-emerald-500/20 rounded-lg">
                <div className="w-6 h-6 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            }>
              <TickerList onClose={() => setShowTickerList(false)} />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="crypto-cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4 mb-6`}>
              {['BTCUSDT', 'ETHUSDT', 'BNBUSDT'].map((symbol) => (
                <motion.div
                  key={symbol}
                  data-symbol={symbol}
                  className={`crypto-card p-4 rounded-lg border ${
                    activeSymbol === symbol ? 'border-emerald-500' : 'border-emerald-500/20'
                  } bg-black/40 cursor-pointer hover:bg-black/60 transition-colors overflow-hidden ${getPriceHighlightClass(symbol)}`}
                  onClick={() => handleSymbolSelect(symbol)}
                  whileHover={{ scale: isMobile ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: isMobile ? 0.1 : 0.3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-emerald-400">
                        {symbol === 'BTCUSDT' ? <Bitcoin className="w-5 h-5" /> : 
                         symbol === 'ETHUSDT' ? <Coins className="w-5 h-5" /> : 
                         <BarChart2 className="w-5 h-5" />}
                      </div>
                      <span className="font-mono text-sm text-emerald-400">
                        {symbol === 'BTCUSDT' ? 'Bitcoin' : 
                         symbol === 'ETHUSDT' ? 'Ethereum' : 
                         'Binance Coin'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {hasSymbolData(symbol) && (
                        changes[symbol] >= 0 ? (
                          <TrendingUp size={16} className="text-emerald-400" />
                        ) : (
                          <TrendingDown size={16} className="text-red-400" />
                        )
                      )}
                    </div>
                  </div>
                  <div className="price-container">
                    <span className="price">
                      {hasSymbolData(symbol) ? formatPrice(prices[symbol]) : "$-.--"}
                    </span>
                    <span className={`price-change ${
                      !hasSymbolData(symbol) ? 'text-emerald-400/50' : 
                      changes[symbol] >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {hasSymbolData(symbol) ? 
                        `${changes[symbol] >= 0 ? '+' : ''}${changes[symbol].toFixed(2)}%` : 
                        "-.--%" 
                      }
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {activeSymbol && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: isMobile ? 0.2 : 0.3 }}
              >
                <Suspense fallback={
                  <div className="flex items-center justify-center h-40 border border-dashed border-emerald-500/20 rounded-lg">
                    <div className="w-6 h-6 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                }>
                  <LiveChart 
                    key={liveChartKey}
                    symbol={activeSymbol} 
                    onClose={() => setActiveSymbol(null)} 
                  />
                </Suspense>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CryptoChartsView;
