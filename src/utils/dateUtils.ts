
import { format } from 'date-fns-tz';

export const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

export const formatISODate = (date: Date): string => {
  return date.toISOString();
};
