
import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bitcoin, Coins, BarChart2, RefreshCw, X, TrendingUp, TrendingDown, BarChart, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const LiveChart = lazy(() => import('./LiveChart'));
const TickerList = lazy(() => import('./TickerList'));

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
  const webSocketRef = useRef<WebSocket | null>(null);
  const autoRefreshIntervalRef = useRef<number | null>(null);

  const connectWebSocket = () => {
    // Close existing WebSocket if it exists
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.close();
    }

    // Set up WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/functions/v1/crypto-prices`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    webSocketRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      toast.success('Live connection established', { id: 'ws-connection' });
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        
        if (message.type === 'prices') {
          const newPrices = { ...prices };
          const newChanges = { ...changes };
          
          message.data.forEach(({ symbol, price, change }) => {
            newPrices[symbol] = price;
            newChanges[symbol] = change;
          });
          
          setPrices(newPrices);
          setChanges(newChanges);
          if (!isInitialized) setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Live connection error', { id: 'ws-error' });
      
      // Try to refresh via HTTP if WebSocket fails
      refreshPrices();
      
      // Try to reconnect WebSocket after a delay
      setTimeout(() => {
        if (document.visibilityState !== 'hidden') {
          connectWebSocket();
        }
      }, 5000);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  };

  const refreshPrices = async () => {
    setIsLoading(true);
    try {
      const { data: pricesData, error: pricesError } = await supabase.functions.invoke('crypto-prices');
      
      if (pricesError) throw pricesError;

      setPreviousPrices({...prices});
      
      const newPrices = pricesData.reduce((acc, curr) => ({
        ...acc,
        [curr.symbol]: curr.price
      }), {});
      
      const newChanges = Object.keys(newPrices).reduce((acc, symbol) => {
        const previousPrice = previousPrices[symbol] || prices[symbol];
        if (!previousPrice) return {...acc, [symbol]: 0};
        
        const change = ((newPrices[symbol] - previousPrice) / previousPrice) * 100;
        return {...acc, [symbol]: change};
      }, {});
      
      console.log('Fetched prices via HTTP:', newPrices);
      setPrices(newPrices);
      setChanges(newChanges);
      if (!isInitialized) setIsInitialized(true);
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      toast.error('Failed to fetch crypto prices');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up auto-refresh fallback (in case WebSocket fails)
  const setupAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      window.clearInterval(autoRefreshIntervalRef.current);
    }
    
    autoRefreshIntervalRef.current = window.setInterval(() => {
      // Only refresh if WebSocket is not connected
      if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
        console.log('Auto-refreshing prices via HTTP (WebSocket not connected)');
        refreshPrices();
      }
    }, 15000); // Every 15 seconds
  };

  useEffect(() => {
    // Initial fetch
    refreshPrices();
    
    // Set up WebSocket
    connectWebSocket();
    
    // Setup auto-refresh as fallback
    setupAutoRefresh();
    
    // Reconnect when window becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, reconnecting WebSocket');
        connectWebSocket();
        refreshPrices();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      if (autoRefreshIntervalRef.current) {
        window.clearInterval(autoRefreshIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number): string => {
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
            <div className={`w-2 h-2 rounded-full ${webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-emerald-400/70 font-mono">LIVE</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowTickerList(!showTickerList)} 
            className="p-1.5 rounded-lg bg-black/40 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            title="Show all tickers"
          >
            <List size={16} />
          </button>
          <button 
            onClick={() => {
              refreshPrices();
              connectWebSocket();
            }} 
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
      
      <AnimatePresence mode="wait">
        {showTickerList ? (
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
                  className={`crypto-card p-4 rounded-lg border ${
                    activeSymbol === symbol ? 'border-emerald-500' : 'border-emerald-500/20'
                  } bg-black/40 cursor-pointer hover:bg-black/60 transition-colors`}
                  onClick={() => handleSymbolSelect(symbol)}
                  whileHover={{ scale: isMobile ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: isMobile ? 0.1 : 0.3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-emerald-400">
                        {getIconForSymbol(symbol)}
                      </div>
                      <span className="font-mono text-sm text-emerald-400">{getNameForSymbol(symbol)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {isNaN(changes[symbol]) ? null : changes[symbol] >= 0 ? (
                        <TrendingUp size={16} className="text-emerald-400" />
                      ) : (
                        <TrendingDown size={16} className="text-red-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-bold text-white font-mono">{formatPrice(prices[symbol])}</span>
                    <span className={`text-sm font-mono ${
                      isNaN(changes[symbol]) ? 'text-emerald-400/50' : 
                      changes[symbol] >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {isNaN(changes[symbol]) ? '--' : formatChange(changes[symbol])}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <AnimatePresence>
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
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CryptoChartsView;
