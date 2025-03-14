import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, TrendingUp, TrendingDown, AlertTriangle, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  formatPercentage, 
  formatPrice, 
  getInitialPrice, 
  getTimeframeText,
  calculateOpenClosePerformance,
  formatCurrency,
} from '@/utils/performanceUtils';

type PerformanceData = {
  symbol: string;
  performance: number;
  priceData: Array<{
    timestamp: number;
    price: number;
  }>;
  klineData?: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  currentPrice: number;
  isNewListing?: boolean;
  dataPoints?: number;
  expectedDataPoints?: number;
  daysCovered?: string;
  initialPrice?: number;
}

interface TopPerformersChartProps {
  onClose: () => void;
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

const TopPerformersChart: React.FC<TopPerformersChartProps> = ({ onClose }) => {
  const [topPerformers, setTopPerformers] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<number>(7);
  const [limit, setLimit] = useState<number>(10);
  const [normalizedData, setNormalizedData] = useState<any[]>([]);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<PerformanceData | null>(null);
  const [tokenDetailsOpen, setTokenDetailsOpen] = useState(false);

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
          limit: limit,
          useOHLC: true
        }
      });
      
      if (error) throw error;
      
      console.log('Fetched top performers:', data);
      
      const enhancedData = data.map((performer: PerformanceData) => {
        let calculatedPerformance = performer.performance;
        
        if (performer.klineData && performer.klineData.length >= 2) {
          calculatedPerformance = calculateOpenClosePerformance(performer.klineData);
        }
        
        return {
          ...performer,
          performance: calculatedPerformance,
          initialPrice: performer.klineData?.length ? performer.klineData[0].open : 
                        (performer.priceData.length > 0 ? performer.priceData[0].price : 0)
        };
      });
      
      setTopPerformers(enhancedData);
      
      normalizeDataForChart(enhancedData);
      
    } catch (error) {
      console.error('Error fetching top performers:', error);
      toast.error('Failed to fetch top performers');
    } finally {
      setIsLoading(false);
    }
  };
  
  const normalizeDataForChart = (performers: PerformanceData[]) => {
    if (!performers.length) return;
    
    const hasKlineData = performers.some(p => p.klineData && p.klineData.length > 0);
    
    if (hasKlineData) {
      const allTimestamps = new Set<number>();
      performers.forEach(performer => {
        if (performer.klineData) {
          performer.klineData.forEach(kline => {
            allTimestamps.add(kline.timestamp);
          });
        }
      });
      
      const timestampArray = Array.from(allTimestamps).sort((a, b) => a - b);
      
      const normalized = timestampArray.map(timestamp => {
        const dataPoint: any = { timestamp };
        
        performers.forEach(performer => {
          if (performer.klineData) {
            const matchingKline = performer.klineData.find(k => k.timestamp === timestamp);
            if (matchingKline) {
              const initialOpen = performer.klineData[0]?.open || 1;
              const percentChange = ((matchingKline.close - initialOpen) / initialOpen) * 100;
              dataPoint[performer.symbol] = percentChange;
            }
          }
        });
        
        return dataPoint;
      });
      
      const sortedData = normalized.sort((a, b) => a.timestamp - b.timestamp);
      const formattedData = sortedData.map(point => ({
        ...point,
        formattedDate: new Date(point.timestamp).toLocaleDateString()
      }));
      
      setNormalizedData(formattedData);
    } else {
      const allTimestamps = new Set<number>();
      performers.forEach(performer => {
        performer.priceData.forEach(point => {
          allTimestamps.add(point.timestamp);
        });
      });
      
      const timestampArray = Array.from(allTimestamps).sort((a, b) => a - b);
      
      const normalized = timestampArray.map(timestamp => {
        const dataPoint: any = { timestamp };
        
        performers.forEach(performer => {
          const matchingPoint = performer.priceData.find(p => p.timestamp === timestamp);
          if (matchingPoint) {
            const initialPrice = performer.priceData[0]?.price || 1;
            const percentChange = ((matchingPoint.price - initialPrice) / initialPrice) * 100;
            dataPoint[performer.symbol] = percentChange;
          }
        });
        
        return dataPoint;
      });
      
      const sortedData = normalized.sort((a, b) => a.timestamp - b.timestamp);
      const formattedData = sortedData.map(point => ({
        ...point,
        formattedDate: new Date(point.timestamp).toLocaleDateString()
      }));
      
      setNormalizedData(formattedData);
    }
  };

  const handleTokenCardClick = (performer: PerformanceData) => {
    setSelectedToken(performer);
    setTokenDetailsOpen(true);
  };

  const InfoNote = () => (
    <div className="text-amber-200 text-xs leading-relaxed">
      <p className="mb-2">
        <span className="font-bold">How performance is calculated:</span>
      </p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Performance is measured from the <strong>opening price</strong> of the first candle to the <strong>closing price</strong> of the most recent candle within the selected timeframe ({getTimeframeText(timeframe)}).</li>
        <li>For tokens with complete data history, this shows the real market performance over time.</li>
        <li>For new listings with incomplete data, performance is calculated from the earliest available price point.</li>
        <li>Tokens marked with <AlertTriangle size={12} className="inline text-amber-400 mx-1" /> are new listings with less than complete data for the selected timeframe.</li>
        <li>The number beside the warning icon (e.g., "16d") indicates the number of days of data available for that token.</li>
      </ul>
      <p className="mt-2">
        This methodology aligns with standard financial market analysis by comparing opening and closing prices rather than arbitrary points during trading sessions.
      </p>
    </div>
  );

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
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
            onClick={() => setInfoDialogOpen(true)}
            className="p-1.5 rounded-lg bg-black/40 text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <Info size={16} />
          </button>
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
            className="bg-black/30 border border-emerald-500/10 rounded-lg p-2 flex flex-col cursor-pointer hover:border-emerald-500/40 transition-colors"
            onClick={() => handleTokenCardClick(performer)}
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
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="ml-1 cursor-help"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AlertTriangle size={12} className="text-amber-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-black/90 border-amber-500/30 text-amber-200 text-xs max-w-[250px]">
                        <p className="font-bold mb-1">New Listing Alert!</p>
                        <p className="mb-1">{performer.symbol.replace('USDT', '')} was listed <span className="text-amber-400 font-bold">{performer.daysCovered}</span> days ago.</p>
                        <p>Performance is calculated from its initial price of {formatPrice(performer.initialPrice || (performer.klineData?.length ? performer.klineData[0].open : getInitialPrice(performer.priceData)))}</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <span className="text-white text-sm font-mono">
              {formatPrice(performer.currentPrice)}
            </span>
            <div className="flex items-center">
              <span className={`text-xs font-mono ${performer.performance >= 0 ? 'text-emerald-400 flex items-center' : 'text-red-400 flex items-center'}`}>
                {performer.performance >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {formatPercentage(performer.performance)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Dialog 
        open={infoDialogOpen} 
        onOpenChange={setInfoDialogOpen}
      >
        <DialogContent className="bg-black/95 border border-amber-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <Info size={18} />
              Performance Calculation Info
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <InfoNote />
          </DialogDescription>
        </DialogContent>
      </Dialog>
      
      <Dialog 
        open={tokenDetailsOpen} 
        onOpenChange={setTokenDetailsOpen}
      >
        <DialogContent className="bg-black/95 border border-emerald-500/30 text-white max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="text-emerald-400 flex items-center gap-2">
              {selectedToken && (
                <>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ 
                      backgroundColor: COLORS[topPerformers.findIndex(p => p.symbol === selectedToken.symbol) % COLORS.length] 
                    }}
                  />
                  {selectedToken.symbol.replace('USDT', '')} Details
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedToken && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-3 rounded-lg border border-emerald-500/20">
                  <div className="text-gray-400 text-xs mb-1">Current Price</div>
                  <div className="text-white font-mono text-lg">{formatPrice(selectedToken.currentPrice)}</div>
                </div>
                
                <div className="bg-black/40 p-3 rounded-lg border border-emerald-500/20">
                  <div className="text-gray-400 text-xs mb-1">Performance ({timeframe}D)</div>
                  <div className={`font-mono text-lg flex items-center ${selectedToken.performance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedToken.performance >= 0 ? (
                      <ArrowUp className="mr-1" size={18} />
                    ) : (
                      <ArrowDown className="mr-1" size={18} />
                    )}
                    {formatPercentage(selectedToken.performance)}
                  </div>
                </div>
                
                <div className="bg-black/40 p-3 rounded-lg border border-emerald-500/20">
                  <div className="text-gray-400 text-xs mb-1">Initial Price ({timeframe}D)</div>
                  <div className="text-white font-mono text-lg">
                    {formatPrice(selectedToken.initialPrice || 0)}
                  </div>
                </div>
                
                {selectedToken.klineData && selectedToken.klineData.length > 0 && (
                  <>
                    <div className="bg-black/40 p-3 rounded-lg border border-emerald-500/20">
                      <div className="text-gray-400 text-xs mb-1">24h Volume</div>
                      <div className="text-white font-mono text-lg">
                        ${formatNumber(selectedToken.klineData[selectedToken.klineData.length - 1].volume)}
                      </div>
                    </div>
                    
                    <div className="bg-black/40 p-3 rounded-lg border border-emerald-500/20">
                      <div className="text-gray-400 text-xs mb-1">24h High</div>
                      <div className="text-white font-mono text-lg">
                        {formatPrice(selectedToken.klineData[selectedToken.klineData.length - 1].high)}
                      </div>
                    </div>
                    
                    <div className="bg-black/40 p-3 rounded-lg border border-emerald-500/20">
                      <div className="text-gray-400 text-xs mb-1">24h Low</div>
                      <div className="text-white font-mono text-lg">
                        {formatPrice(selectedToken.klineData[selectedToken.klineData.length - 1].low)}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-4">
                <div className="text-sm text-gray-300 mb-2 flex items-center justify-between">
                  <span>Price History ({timeframe}D)</span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs text-emerald-400/70">Close Price</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-xs text-emerald-400/70">Open Price</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[250px] bg-black/30 border border-emerald-500/20 rounded-lg p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={selectedToken.klineData || selectedToken.priceData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.1)" />
                      <XAxis 
                        dataKey="timestamp" 
                        tick={{ fill: '#10B981', fontSize: 10 }}
                        tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
                        stroke="#10B981"
                      />
                      <YAxis 
                        tick={{ fill: '#10B981', fontSize: 10 }}
                        stroke="#10B981"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-black/90 border border-emerald-500/30 p-2 rounded">
                                <p className="text-emerald-400 text-xs">
                                  {new Date(label).toLocaleDateString()}
                                </p>
                                {data.open !== undefined ? (
                                  <div className="text-xs">
                                    <p className="text-blue-400">Open: {formatPrice(data.open)}</p>
                                    <p className="text-white">High: {formatPrice(data.high)}</p>
                                    <p className="text-white">Low: {formatPrice(data.low)}</p>
                                    <p className="text-emerald-400">Close: {formatPrice(data.close)}</p>
                                    <p className="text-white">Volume: ${formatNumber(data.volume)}</p>
                                  </div>
                                ) : (
                                  <p className="text-white text-xs">
                                    Price: {formatPrice(data.price)}
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {selectedToken.klineData ? (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey="close" 
                            name="Close Price" 
                            stroke="#10B981" 
                            dot={false}
                            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#111' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="open" 
                            name="Open Price" 
                            stroke="#0EA5E9" 
                            dot={false}
                            strokeDasharray="5 5"
                            activeDot={{ r: 6, stroke: '#0EA5E9', strokeWidth: 2, fill: '#111' }}
                          />
                        </>
                      ) : (
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          name="Price" 
                          stroke="#10B981" 
                          dot={false}
                          activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#111' }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {selectedToken.isNewListing && (
                <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-lg mt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-amber-400 text-sm font-bold">New Listing</p>
                      <p className="text-amber-200 text-xs mt-1">
                        {selectedToken.symbol.replace('USDT', '')} was listed {selectedToken.daysCovered} days ago.
                        Performance data might be incomplete compared to the selected {timeframe}-day timeframe.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = label;
    
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

export default TopPerformersChart;
