
/**
 * Checks if the first date is older than or equal to the second date
 */
export function isOlderThan(dateString1: string, dateString2: string): boolean {
  const date1 = new Date(dateString1).getTime();
  const date2 = new Date(dateString2).getTime();
  return date1 <= date2;
}

/**
 * Formats a date for database storage
 */
export function formatDatabaseTimestamp(date: Date): string {
  return date.toISOString();
}

/**
 * Parses a Twitter date string into a standardized ISO format
 */
export function parseTwitterDate(twitterDateStr: string): string {
  return new Date(twitterDateStr).toISOString();
}
