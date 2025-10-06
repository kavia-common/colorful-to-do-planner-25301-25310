/**
 * Date utilities: parsing, comparisons, and sort helpers.
 * All functions are pure and unit-friendly. No external dependencies.
 */

/**
 * Safely parse a date-like input.
 * Accepts Date object, ISO string, timestamp number, or null/undefined.
 * Returns a valid Date or null if parsing fails.
 *
 * @param {Date | string | number | null | undefined} value - Input to parse
 * @returns {Date | null} Parsed Date or null if invalid
 */
// PUBLIC_INTERFACE
export function parseDate(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Normalize a Date to midnight in local time for day-level comparisons.
 * @param {Date} d
 * @returns {Date}
 */
function atStartOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Check if a given date is today in local time.
 *
 * @param {Date | string | number | null | undefined} date - Date-like input
 * @param {Date} [today=new Date()] - anchor date for tests
 * @returns {boolean} True if date is today, false otherwise
 */
// PUBLIC_INTERFACE
export function isToday(date, today = new Date()) {
  const d = parseDate(date);
  if (!d) return false;
  const a = atStartOfDay(d);
  const b = atStartOfDay(parseDate(today) || new Date());
  return a.getTime() === b.getTime();
}

/**
 * Check if a given date is strictly after "today" (future day).
 * Time-of-day is ignored; comparison is by date (local time).
 *
 * @param {Date | string | number | null | undefined} date - Date-like input being evaluated
 * @param {Date} [today=new Date()] - Anchor date representing "now"
 * @returns {boolean} True if date is after today, false otherwise
 */
// PUBLIC_INTERFACE
export function isUpcoming(date, today = new Date()) {
  const d = parseDate(date);
  if (!d) return false;
  const a = atStartOfDay(d);
  const b = atStartOfDay(parseDate(today) || new Date());
  return a.getTime() > b.getTime();
}

/**
 * Check if a given date is overdue relative to "today".
 * Overdue means the date is strictly before today (past day).
 * Null/undefined dates are not considered overdue.
 *
 * @param {Date | string | number | null | undefined} date
 * @param {Date} [today=new Date()]
 * @returns {boolean} True if overdue, false otherwise
 */
// PUBLIC_INTERFACE
export function isOverdue(date, today = new Date()) {
  const d = parseDate(date);
  if (!d) return false;
  const a = atStartOfDay(d);
  const b = atStartOfDay(parseDate(today) || new Date());
  return a.getTime() < b.getTime();
}

/**
 * Comparator to sort tasks by due date ascending.
 * - Items with null/undefined/invalid due date are sorted last.
 * - When both due dates are invalid/missing, falls back to 0 (stable order).
 *
 * Expects objects like { dueDate?: string|Date|number|null }
 *
 * @template T extends { [key: string]: any }
 * @param {T} a
 * @param {T} b
 * @param {string} [field='dueDate'] - field name containing the due date
 * @returns {number} -1, 0, 1 suitable for Array.prototype.sort
 */
// PUBLIC_INTERFACE
export function compareByDue(a, b, field = 'dueDate') {
  const da = parseDate(a?.[field]);
  const db = parseDate(b?.[field]);

  const aValid = !!da;
  const bValid = !!db;

  if (!aValid && !bValid) return 0;
  if (!aValid) return 1; // a goes last
  if (!bValid) return -1; // b goes last

  const at = da.getTime();
  const bt = db.getTime();
  if (at < bt) return -1;
  if (at > bt) return 1;
  return 0;
}

/**
 * Comparator to sort items by createdAt ascending (older first).
 * - Items with invalid/missing createdAt are sorted last.
 *
 * Expects objects like { createdAt: string|Date|number }
 *
 * @template T extends { [key: string]: any }
 * @param {T} a
 * @param {T} b
 * @param {string} [field='createdAt'] - field name containing the created at value
 * @returns {number} -1, 0, 1
 */
// PUBLIC_INTERFACE
export function compareByCreated(a, b, field = 'createdAt') {
  const da = parseDate(a?.[field]);
  const db = parseDate(b?.[field]);

  const aValid = !!da;
  const bValid = !!db;

  if (!aValid && !bValid) return 0;
  if (!aValid) return 1;
  if (!bValid) return -1;

  const at = da.getTime();
  const bt = db.getTime();
  if (at < bt) return -1;
  if (at > bt) return 1;
  return 0;
}

export default {
  parseDate,
  isToday,
  isUpcoming,
  isOverdue,
  compareByDue,
  compareByCreated,
};
