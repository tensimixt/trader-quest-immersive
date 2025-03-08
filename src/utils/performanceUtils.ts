// Add this import at the top if it's not already there
import { format as formatDate } from 'date-fns';

// Add this export if not already present
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
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
