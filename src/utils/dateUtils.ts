
import { format } from 'date-fns-tz';

export const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

// General purpose date formatter that works with any timezone
export const formatDateTime = (date: Date | string, formatStr = 'yyyy-MM-dd HH:mm:ss', timezone = 'UTC') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { timeZone: timezone });
};
