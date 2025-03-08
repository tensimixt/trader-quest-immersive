
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

// New utility function to normalize price data for charts
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

// Function to detect if a token is likely a new listing
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
