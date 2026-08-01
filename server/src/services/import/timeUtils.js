// Time parsing utilities for the workbook importer.
// Supports Excel time serials, JS Date/time objects, bare hour numbers ("9", "14"),
// 24-hour "HH:MM" strings, and 12-hour "H:MM AM/PM" / "H AM" strings.
// Everything is normalized to minutes-since-midnight internally, and can be
// formatted back to a canonical "HH:MM" (24-hour) string.

const RE_HHMM_AMPM = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/;
const RE_H_AMPM = /^(\d{1,2})\s*([AaPp][Mm])$/;
const RE_HHMM = /^(\d{1,2}):(\d{2})(?::\d{2})?$/; // tolerate trailing :SS
const RE_HOUR_ONLY = /^(\d{1,2})$/;

function to24HourMinutes(hour12, minute, ampm) {
  let hour = hour12 % 12;
  if (/pm/i.test(ampm)) hour += 12;
  return hour * 60 + minute;
}

/**
 * Parse any supported time representation into minutes-since-midnight.
 * Returns null when the value is missing or cannot be parsed.
 */
export function parseTimeToMinutes(value) {
  if (value === undefined || value === null || value === '') return null;

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.getUTCHours() * 60 + value.getUTCMinutes();
  }

  if (typeof value === 'number') {
    if (!isFinite(value)) return null;
    if (value < 0) return null;
    if (value < 1) {
      // Excel fractional-day time serial (e.g. 0.375 -> 09:00)
      return Math.round(value * 24 * 60);
    }
    if (Number.isInteger(value) && value <= 23) {
      // A bare hour typed directly into the cell (e.g. 9 or 14)
      return value * 60;
    }
    if (value < 10000) {
      // Neither a valid bare hour (0-23) nor a plausible Excel date serial
      // (real-world date serials are in the tens of thousands) - reject.
      return null;
    }
    // Full Excel datetime serial (integer part = date, fractional part = time-of-day)
    const frac = value - Math.floor(value);
    return Math.round(frac * 24 * 60);
  }

  const str = String(value).trim();
  if (!str) return null;

  let m = str.match(RE_HHMM_AMPM);
  if (m) return to24HourMinutes(parseInt(m[1], 10), parseInt(m[2], 10), m[3]);

  m = str.match(RE_H_AMPM);
  if (m) return to24HourMinutes(parseInt(m[1], 10), 0, m[2]);

  m = str.match(RE_HHMM);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }

  m = str.match(RE_HOUR_ONLY);
  if (m) {
    const h = parseInt(m[1], 10);
    if (h > 23) return null;
    return h * 60;
  }

  return null;
}

/** Format minutes-since-midnight to a canonical 24-hour "HH:MM" string. */
export function minutesToHHMM(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes)) return '';
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Convenience: parse any supported time value straight to "HH:MM", or '' if invalid. */
export function parseTimeToHHMM(value) {
  const mins = parseTimeToMinutes(value);
  return mins === null ? '' : minutesToHHMM(mins);
}
