// Weekday normalization utilities.
// Accepts "MONDAY", "Monday", "Mon", "MON", "mon.", etc. and normalizes to the
// canonical uppercase full name used by the Prisma `Day` enum.

export const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
];

export const WEEKDAY_DISPLAY = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday'
};

const DAY_ALIASES = {
  MON: 'MONDAY',
  MONDAY: 'MONDAY',
  TUE: 'TUESDAY',
  TUES: 'TUESDAY',
  TUESDAY: 'TUESDAY',
  WED: 'WEDNESDAY',
  WEDS: 'WEDNESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THU: 'THURSDAY',
  THUR: 'THURSDAY',
  THURS: 'THURSDAY',
  THURSDAY: 'THURSDAY',
  FRI: 'FRIDAY',
  FRIDAY: 'FRIDAY',
  SAT: 'SATURDAY',
  SATURDAY: 'SATURDAY',
  SUN: 'SUNDAY',
  SUNDAY: 'SUNDAY'
};

/**
 * Normalize any supported weekday spelling/abbreviation into the canonical
 * uppercase full day name (e.g. "Mon" -> "MONDAY"). Returns null if unrecognized.
 */
export function normalizeDay(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim().toUpperCase().replace(/\.+$/, '');
  return DAY_ALIASES[cleaned] || null;
}
