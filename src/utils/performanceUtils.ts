type MarketCall = {
  timestamp: string;
  roi: number;
};

export const generatePerformanceData = (calls: MarketCall[], year: string) => {
  const filteredCalls = calls.filter(call => call.timestamp.startsWith(year));
  const totalCalls = filteredCalls.length;
  const winningCalls = filteredCalls.filter(call => call.roi > 0).length;
  const overallWinRate = totalCalls > 0 ? (winningCalls / totalCalls) * 100 : 0;

  const monthlyData = Array(12).fill(null).map((_, i) => {
    const month = String(i + 1).padStart(2, '0');
    const monthCalls = calls.filter(call => call.timestamp.startsWith(`${year}-${month}`));
    const totalMonthCalls = monthCalls.length;
    const winningMonthCalls = monthCalls.filter(call => call.roi > 0).length;
    const winRate = totalMonthCalls > 0 ? (winningMonthCalls / totalMonthCalls) * 100 : 0;
    return { month: month, winRate: parseFloat(winRate.toFixed(2)) };
  });

  return {
    overall: parseFloat(overallWinRate.toFixed(2)),
    monthlyData: monthlyData,
    totalTrades: totalCalls,
    wins: winningCalls
  };
};

export const normalizeChartData = (priceData: Array<{timestamp: number, price: number}>) => {
  if (!priceData.length) return [];
  
  const initialPrice = priceData[0].price;
  
  return priceData.map(point => ({
    timestamp: point.timestamp,
    formattedDate: new Date(point.timestamp).toLocaleDateString(),
    percentChange: ((point.price - initialPrice) / initialPrice) * 100,
    price: point.price
  }));
};

export const isLikelyNewListing = (
  priceData: Array<{timestamp: number, price: number}>, 
  expectedDays: number
) => {
  if (priceData.length < 2) return false;
  
  const firstTimestamp = priceData[0].timestamp;
  const lastTimestamp = priceData[priceData.length - 1].timestamp;
  const daysCovered = (lastTimestamp - firstTimestamp) / (1000 * 60 * 60 * 24);
  
  return daysCovered < (expectedDays * 0.8);
};

export const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const formatPrice = (price: number): string => {
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 1000) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export const formatCurrency = formatPrice;

export const getInitialPrice = (priceData: Array<{timestamp: number, price: number}>): number => {
  return priceData.length > 0 ? priceData[0].price : 0;
};

export const getTimeframeText = (days: number): string => {
  if (days === 1) return "24 hours";
  if (days === 7) return "7 days";
  if (days === 30) return "30 days";
  return `${days} days`;
};

export const calculateOpenClosePerformance = (
  klines: Array<{
    timestamp: number, 
    open: number, 
    high: number, 
    low: number, 
    close: number,
    volume: number
  }>
): number => {
  if (klines.length < 2) return 0;
  
  const firstOpen = klines[0].open;
  const lastClose = klines[klines.length - 1].close;
  
  return ((lastClose - firstOpen) / firstOpen) * 100;
};

export const normalizeOHLCChartData = (
  klines: Array<{
    timestamp: number, 
    open: number, 
    high: number, 
    low: number, 
    close: number,
    volume: number
  }>
) => {
  if (!klines.length) return [];
  
  const initialOpen = klines[0].open;
  
  return klines.map(kline => ({
    timestamp: kline.timestamp,
    formattedDate: new Date(kline.timestamp).toLocaleDateString(),
    percentChange: ((kline.close - initialOpen) / initialOpen) * 100,
    open: kline.open,
    close: kline.close,
    high: kline.high,
    low: kline.low
  }));
};

export const getDailyChange = (
  kline: {
    open: number, 
    close: number
  }
): number => {
  return ((kline.close - kline.open) / kline.open) * 100;
};

export const formatDailyChange = (change: number): string => {
  const arrow = change >= 0 ? '↑' : '↓';
  return `${arrow} ${Math.abs(change).toFixed(2)}%`;
};
