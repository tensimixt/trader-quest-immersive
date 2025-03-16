
import { format } from 'date-fns-tz';

export const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

export const formatUtcTime = (date: Date) => {
  return format(date, "yyyy-MM-dd HH:mm:ssXXX", { timeZone: 'UTC' });
};

// Parse a date string in ISO or custom format to a Date object
export const parseDate = (dateStr: string): Date => {
  // If it's a standard ISO string, use built-in Date parsing
  if (dateStr.includes('T') || dateStr.includes('Z')) {
    return new Date(dateStr);
  }
  
  // Format: "yyyy-MM-dd HH:mm:ssXXX" (e.g., "2023-04-15 12:30:00+00:00")
  try {
    // Replace space with 'T' to make it ISO compatible
    const isoFormat = dateStr.replace(' ', 'T');
    return new Date(isoFormat);
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
    return new Date(); // Return current date as fallback
  }
};

// Compare two dates and return true if date1 is before date2
export const isDateBefore = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = date1 instanceof Date ? date1 : parseDate(date1);
  const d2 = date2 instanceof Date ? date2 : parseDate(date2);
  return d1 < d2;
};

// Compare two dates and return true if date1 is after date2
export const isDateAfter = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = date1 instanceof Date ? date1 : parseDate(date1);
  const d2 = date2 instanceof Date ? date2 : parseDate(date2);
  return d1 > d2;
};
