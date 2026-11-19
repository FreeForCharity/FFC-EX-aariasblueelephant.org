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


/** Start of today, local time. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** True when the event has a real end date after its start date. */
export function isMultiDayEvent(e: { date: string; endDate?: string }): boolean {
  return !!e.endDate && e.endDate.slice(0, 10) > (e.date || '').slice(0, 10);
}

/** The last day the event runs: its end date if it has one, else its date. */
export function eventLastDay(e: { date: string; endDate?: string }): Date | null {
  return parseDateLocal(isMultiDayEvent(e) ? e.endDate!.slice(0, 10) : e.date);
}

/** Past = its last day is before today. A season that started already but hasn't ended isn't past. */
export function isEventPast(e: { date: string; endDate?: string }): boolean {
  const last = eventLastDay(e);
  return !!last && last < startOfToday();
}

/** Started already (start before today) but not finished yet. */
export function isEventOngoing(e: { date: string; endDate?: string }): boolean {
  const start = parseDateLocal(e.date);
  return isMultiDayEvent(e) && !!start && start < startOfToday() && !isEventPast(e);
}

/**
 * The event's date for display. Single-day events read as before; a range reads
 * "Jan 7 – Dec 19, 2027" (short) or "Thursday, January 7, 2027 – Sunday, December 19, 2027" (long).
 */
export function formatEventDate(e: { date: string; endDate?: string }, style: 'short' | 'long' = 'long'): string {
  const fmt = style === 'short' ? formatShortDateLocal : (d: string) => formatDateLocal(d);
  if (!isMultiDayEvent(e)) return fmt(e.date);
  const start = parseDateLocal(e.date);
  const end = parseDateLocal(e.endDate!.slice(0, 10));
  if (style === 'short' && start && end && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${fmt(e.endDate!.slice(0, 10))}`;
  }
  if (style === 'long' && start && end) {
    const o: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', o)} – ${end.toLocaleDateString('en-US', o)}`;
  }
  return `${fmt(e.date)} – ${fmt(e.endDate!.slice(0, 10))}`;
}
