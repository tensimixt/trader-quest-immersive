
import { format } from 'date-fns-tz';
import { PerformanceData } from '../types/market';

export const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

export const generatePerformanceData = (calls: any[], year: string): PerformanceData => {
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(parseInt(year), i);
    return {
      month: format(monthDate, 'MMM'),
      winRate: Math.floor(Math.random() * 30) + 70
    };
  });

  const overall = Math.floor(
    monthlyData.reduce((acc, month) => acc + month.winRate, 0) / monthlyData.length
  );

  return {
    monthlyData,
    overall
  };
};
