/**
 * Unified Date Utilities to prevent off-by-one errors caused by UTC/Local time shifts.
 * 
 * Standard ISO strings (YYYY-MM-DD) when passed directly to `new Date()` are parsed as UTC midnight.
 * This causing them to shift to the previous day in local time zones like Pacific Time.
 */

/**
 * Safely parses a YYYY-MM-DD string as a local Date object.
 * If the string is already a Date or not in YYYY-MM-DD format,
 * it returns a new Date trying to parse the string, or null if invalid.
 */
export function parseDateLocal(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // If it's a YYYY-MM-DD string
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Try standard parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a date string into a human-readable local date.
 * If the string is not a date (e.g. "Ongoing"), returns the original string.
 */
export function formatDateLocal(
  dateStr: string, 
  options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
): string {
  if (!dateStr) return '';
  
  const dateObj = parseDateLocal(dateStr);
  if (!dateObj) return dateStr; // Return original string if not a date (e.g. "Ongoing")
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Minimal date string format (e.g., for summary cards)
 * Example: "Apr 7, 2026"
 */
export function formatShortDateLocal(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return formatDateLocal(dateStr, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  // If it's already a short date or non-date, return it
  const dateObj = parseDateLocal(dateStr);
  if (!dateObj || isNaN(dateObj.getTime())) return dateStr;
  
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
