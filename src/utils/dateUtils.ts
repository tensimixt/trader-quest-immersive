
import { format } from 'date-fns-tz';

export const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

export const formatUtcTime = (date: Date) => {
  return format(date, "yyyy-MM-dd HH:mm:ssXXX", { timeZone: 'UTC' });
};
