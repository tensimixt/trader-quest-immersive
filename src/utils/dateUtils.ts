
import { format } from 'date-fns-tz';

export const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

// Format a date to ISO string with timezone format that matches our cutoff date format
export const formatISODate = (date: Date) => {
  return date.toISOString().replace('T', ' ').replace('Z', '+00');
};
