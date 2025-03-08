
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
