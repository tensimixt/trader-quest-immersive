import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatPercentage } from '@/utils/performanceUtils';
import { motion } from 'framer-motion';
import { HelpCircle, TrendingUp, ChevronDown, ChevronUp, ExternalLink, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from 'sonner';

interface PerformanceData {
  symbol: string;
  performance: number;
  priceData: {
    timestamp: number;
    price: number;
  }[];
  currentPrice: number;
  klineData?: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  isNewListing?: boolean;
}

interface TokenPrice {
  timestamp: number;
  price: number;
}

interface TopPerformersChartProps {
  onClose?: () => void;
}

const DEFAULT_DAYS = 7;
const DEFAULT_LIMIT = 10;

const performanceColors = {
  positive: {
    primary: "#10B981",
    secondary: "rgba(16, 185, 129, 0.1)"
  },
  negative: {
    primary: "#EF4444",
    secondary: "rgba(239, 68, 68, 0.1)"
  }
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatCompact = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

const TopPerformersChart: React.FC<TopPerformersChartProps> = ({ onClose }) => {
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('7d');
  const [selectedToken, setSelectedToken] = useState<PerformanceData | null>(null);
  const [tokenDetailsOpen, setTokenDetailsOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState<{[key: string]: boolean}>({});
  
  const dialogActionInProgressRef = useRef(false);
  const pendingTokenRef = useRef<PerformanceData | null>(null);
  
  const openTokenDetails = (token: PerformanceData, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (dialogActionInProgressRef.current) {
      pendingTokenRef.current = token;
      return;
    }
    
    dialogActionInProgressRef.current = true;
    console.log(`Opening dialog for ${token.symbol}`);
    
    setTokenDetailsOpen(false);
    
    setTimeout(() => {
      setSelectedToken(token);
      
      setTimeout(() => {
        setTokenDetailsOpen(true);
        
        setTimeout(() => {
          dialogActionInProgressRef.current = false;
          
          if (pendingTokenRef.current) {
            const pendingToken = pendingTokenRef.current;
            pendingTokenRef.current = null;
            openTokenDetails(pendingToken);
          }
        }, 300);
      }, 50);
    }, 50);
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [days, limit]);

  useEffect(() => {
    if (activeTab === '1d') {
      setDays(1);
    } else if (activeTab === '7d') {
      setDays(7);
    } else if (activeTab === '30d') {
      setDays(30);
    }
  }, [activeTab]);

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    try {
      console.log(`Fetching top performers for ${days} days...`);
      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        body: { getTopPerformers: true, days, limit, useOHLC: true }
      });

      if (error) {
        console.error('Error fetching top performers:', error);
        toast.error('Failed to load performance data');
        return;
      }

      console.log(`Received ${data.length} top performers`);
      setPerformanceData(data);
    } catch (error) {
      console.error('Error in fetchPerformanceData:', error);
      toast.error('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTooltip = (symbol: string) => {
    setTooltipOpen(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 border border-emerald-500/20 p-2 rounded-lg text-sm">
          <p className="text-emerald-400 font-mono">{formatTimestamp(label)}</p>
          <p className="text-white font-mono">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-xl p-4 border border-emerald-500/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">Top Performers</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="bg-black/50">
            <TabsTrigger value="1d" className="text-xs data-[state=active]:bg-emerald-500/20">1D</TabsTrigger>
            <TabsTrigger value="7d" className="text-xs data-[state=active]:bg-emerald-500/20">7D</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs data-[state=active]:bg-emerald-500/20">30D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner border-t-2 border-emerald-500 rounded-full h-8 w-8"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
          {performanceData.slice(0, 9).map((token, index) => {
            const isPositive = token.performance >= 0;
            const colorScheme = isPositive ? performanceColors.positive : performanceColors.negative;
            
            const firstPoint = token.priceData[0];
            const lastPoint = token.priceData[token.priceData.length - 1];
            
            return (
              <motion.div
                key={token.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card rounded-lg p-3 border border-${isPositive ? 'emerald' : 'red'}-500/20 cursor-pointer hover:bg-${isPositive ? 'emerald' : 'red'}-500/10 transition-colors`}
                onClick={(e) => openTokenDetails(token, e)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-white">{token.symbol.replace('USDT', '')}</h3>
                      
                      {token.isNewListing && (
                        <TooltipProvider>
                          <UITooltip open={tooltipOpen[token.symbol]} onOpenChange={(open) => setTooltipOpen(prev => ({ ...prev, [token.symbol]: open }))}>
                            <TooltipTrigger asChild>
                              <div 
                                className="bg-blue-500/30 text-blue-300 text-[10px] px-1.5 rounded-full cursor-help"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTooltip(token.symbol);
                                }}
                              >
                                NEW
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="text-xs">Recent listing with limited historical data</p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-white/70 text-sm font-mono">{formatCurrency(token.currentPrice)}</span>
                      <span className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'} flex items-center`}>
                        {isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {formatPercentage(Math.abs(token.performance))}
                      </span>
                    </div>
                  </div>
                  <div className="px-1 py-0.5 bg-black/30 rounded text-xs text-center">
                    <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>#{index + 1}</span>
                  </div>
                </div>
                
                <div className="h-16 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={token.priceData}>
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke={colorScheme.primary} 
                        dot={false}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex justify-between mt-2 text-xs text-white/50 font-mono">
                  <div>{formatTimestamp(firstPoint?.timestamp || 0)}</div>
                  <div>{formatTimestamp(lastPoint?.timestamp || 0)}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {selectedToken && (
        <Dialog
          open={tokenDetailsOpen}
          onOpenChange={(open) => {
            if (!open && !dialogActionInProgressRef.current) {
              dialogActionInProgressRef.current = true;
              console.log(`Closing dialog for ${selectedToken.symbol}`);
              
              setTokenDetailsOpen(false);
              
              setTimeout(() => {
                setSelectedToken(null);
                dialogActionInProgressRef.current = false;
                
                if (pendingTokenRef.current) {
                  const pendingToken = pendingTokenRef.current;
                  pendingTokenRef.current = null;
                  openTokenDetails(pendingToken);
                }
              }, 300);
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px] bg-black/90 border-emerald-500/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{selectedToken.symbol.replace('USDT', '')} / USDT</span>
                {selectedToken.isNewListing && (
                  <span className="bg-blue-500/30 text-blue-300 text-xs px-2 py-0.5 rounded-full">NEW</span>
                )}
              </DialogTitle>
              <DialogDescription>
                Performance data for the past {days} days
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold font-mono">{formatCurrency(selectedToken.currentPrice)}</p>
                  <div className="flex items-center gap-1">
                    <span className={`${selectedToken.performance >= 0 ? 'text-emerald-400' : 'text-red-400'} flex items-center`}>
                      {selectedToken.performance >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                      {formatPercentage(Math.abs(selectedToken.performance))}
                    </span>
                    <span className="text-xs text-white/50">({days}D)</span>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://www.binance.com/en/trade/${selectedToken.symbol}?theme=dark&type=spot`, '_blank');
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Trade on Binance
                </Button>
              </div>
              
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={selectedToken.priceData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTimestamp} 
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke={selectedToken.performance >= 0 ? "#10B981" : "#EF4444"} 
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {selectedToken.klineData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-black/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-white/50">Open</p>
                    <p className="text-sm font-mono text-white">{formatCurrency(selectedToken.klineData[0].open)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/50">High</p>
                    <p className="text-sm font-mono text-emerald-400">{formatCurrency(Math.max(...selectedToken.klineData.map(k => k.high)))}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/50">Low</p>
                    <p className="text-sm font-mono text-red-400">{formatCurrency(Math.min(...selectedToken.klineData.map(k => k.low)))}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/50">Volume</p>
                    <p className="text-sm font-mono text-white">{formatCompact(selectedToken.klineData.reduce((sum, k) => sum + k.volume, 0))}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TopPerformersChart;
