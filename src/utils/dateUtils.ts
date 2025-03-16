
import { format } from 'date-fns-tz';

export const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

export const formatTimestamp = (timestamp: string) => {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
};

export const formatDatabaseTimestamp = (date: Date) => {
  return format(date, "yyyy-MM-dd HH:mm:ssxxx");
};

export const isOlderThan = (dateString1: string, dateString2: string) => {
  const date1 = new Date(dateString1).getTime();
  const date2 = new Date(dateString2).getTime();
  return date1 <= date2;
};
