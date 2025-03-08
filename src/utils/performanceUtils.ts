// Add this import at the top if it's not already there
import { format as formatDate } from 'date-fns';

// Add this export if not already present
export const formatCurrency = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue) || numericValue === 0) return "$0.00";
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

export const formatPercentage = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return "+0.00%";
  
  return `${numericValue >= 0 ? '+' : ''}${numericValue.toFixed(2)}%`;
};

export const formatPrice = (value: number | string | undefined | null): string => {
  // Handle undefined/null explicitly
  if (value === undefined || value === null) return "$0.00";
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Special case for zero values - show proper $0.00 instead of dash
  if (numericValue === 0) return "$0.00";
  
  // Return placeholder for NaN
  if (isNaN(numericValue)) return "$0.00";
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

// Add a new function to validate price values
export const isValidPrice = (price: any): boolean => {
  if (price === undefined || price === null) return false;
  
  const numericValue = typeof price === 'string' ? parseFloat(price) : price;
  
  return !isNaN(numericValue) && numericValue > 0;
};

export const getInitialPrice = (priceData: Array<{ timestamp: number; price: number }>): number => {
  if (!priceData || priceData.length === 0) return 0;
  return priceData[0].price;
};

export const getTimeframeText = (days: number): string => {
  switch (days) {
    case 1:
      return '24 hours';
    case 7:
      return '7 days';
    case 30:
      return '30 days';
    default:
      return `${days} days`;
  }
};

export const calculateOpenClosePerformance = (klineData: Array<any>): number => {
  if (!klineData || klineData.length < 2) return 0;
  
  const firstOpen = klineData[0].open;
  const lastClose = klineData[klineData.length - 1].close;
  
  return ((lastClose - firstOpen) / firstOpen) * 100;
};

export const normalizeOHLCChartData = (klineData: Array<any>): Array<any> => {
  if (!klineData || klineData.length === 0) return [];
  
  return klineData.map(kline => ({
    time: new Date(kline.timestamp).toISOString().split('T')[0],
    open: kline.open,
    high: kline.high,
    low: kline.low,
    close: kline.close,
    volume: kline.volume
  }));
};

export const getDailyChange = (kline: any): number => {
  if (!kline) return 0;
  return ((kline.close - kline.open) / kline.open) * 100;
};

export const formatDailyChange = (change: number): string => {
  return `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`;
};

export const generatePerformanceData = (marketCalls: Array<any>, year: string): any => {
  // Filter calls for the specified year
  const yearCalls = marketCalls.filter(call => {
    const callYear = new Date(call.timestamp).getFullYear().toString();
    return callYear === year;
  });
  
  // Initialize monthly data
  const monthlyData = Array(12).fill(0).map((_, idx) => ({
    month: new Date(Number(year), idx).toLocaleString('default', { month: 'short' }),
    winRate: 0,
    calls: 0
  }));
  
  // Process calls by month
  yearCalls.forEach(call => {
    const callDate = new Date(call.timestamp);
    const monthIndex = callDate.getMonth();
    
    // Count call
    monthlyData[monthIndex].calls += 1;
    
    // If positive ROI, count as win
    if (call.roi > 0) {
      monthlyData[monthIndex].winRate += 1;
    }
  });
  
  // Calculate win rate percentages
  monthlyData.forEach(month => {
    if (month.calls > 0) {
      month.winRate = (month.winRate / month.calls) * 100;
    }
  });
  
  // Calculate overall win rate
  const totalCalls = yearCalls.length;
  const totalWins = yearCalls.filter(call => call.roi > 0).length;
  const overall = totalCalls > 0 ? Math.round((totalWins / totalCalls) * 100) : 0;
  
  return {
    monthlyData,
    overall
  };
};
