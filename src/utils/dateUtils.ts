
import { format } from 'date-fns-tz';

export const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

export const formatUtcTime = (date: Date) => {
  return format(date, "yyyy-MM-dd HH:mm:ssXXX", { timeZone: 'UTC' });
};

// Parse a date string in UTC format, handling both timezone notation and non-timezone notation
export const parseUtcDate = (dateString: string): Date => {
  if (!dateString) {
    return new Date();
  }
  
  try {
    // Handle dateString with timezone information
    return new Date(dateString);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

// Function to check if a date is before or equal to a cutoff date
export const isBeforeOrEqual = (date: Date, cutoffDate: Date): boolean => {
  return date.getTime() <= cutoffDate.getTime();
};
