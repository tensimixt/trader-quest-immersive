
type MarketCall = {
  timestamp: string;
  roi: number;
};

export const generatePerformanceData = (calls: MarketCall[], year: string) => {
  const monthlyData = Array(12).fill(null).map((_, i) => {
    const month = String(i + 1).padStart(2, '0');
    const monthCalls = calls.filter(call => call.timestamp.startsWith(`${year}-${month}`));
    const totalCalls = monthCalls.length;
    const winningCalls = monthCalls.filter(call => call.roi > 0).length;
    const winRate = totalCalls > 0 ? (winningCalls / totalCalls) * 100 : 0;
    return { month: month, winRate: parseFloat(winRate.toFixed(2)) };
  });

  const totalCalls = calls.filter(call => call.timestamp.startsWith(year)).length;
  const winningCalls = calls.filter(call => call.timestamp.startsWith(year) && call.roi > 0).length;
  const overallWinRate = totalCalls > 0 ? (winningCalls / totalCalls) * 100 : 0;

  return {
    overall: parseFloat(overallWinRate.toFixed(2)),
    monthlyData: monthlyData
  };
};
