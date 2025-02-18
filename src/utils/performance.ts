
export const generatePerformanceData = (calls: any[], year: string) => {
  const targetWinRates = {
    '01': 75, '02': 65, '03': 45, '04': 85,
    '05': 55, '06': 65, '07': 85, '08': 95,
    '09': 55, '10': 75, '11': 85, '12': 65
  };

  const monthlyData = Object.entries(targetWinRates).map(([month, winRate]) => ({
    month: `${month}`,
    winRate,
    calls: Math.floor(Math.random() * 10) + 5
  }));

  const totalCalls = monthlyData.reduce((acc, curr) => acc + curr.calls, 0);
  const weightedWinRate = monthlyData.reduce((acc, curr) => 
    acc + (curr.winRate * curr.calls), 0) / totalCalls;

  return {
    overall: weightedWinRate.toFixed(2),
    monthlyData
  };
};
