import { parseExcelDate, isWithinRange } from './dateUtils.js';

/**
 * Parse the Holidays sheet into holiday objects, using the parsed Semester to
 * flag (and drop) any holiday whose date falls outside the semester range.
 * @returns {{ holidays: object[], errors: string[], warnings: string[] }}
 */
export function parseHolidaysSheet(rows, semester) {
  const errors = [];
  const warnings = [];
  const holidays = [];
  const seenDates = new Set();

  rows.forEach((r, idx) => {
    const rowNum = idx + 2;
    const name = String(r.HolidayName || '').trim();
    const date = parseExcelDate(r.Date);

    if (!name || !date) {
      warnings.push(`Holidays sheet row ${rowNum}: missing or invalid Date/HolidayName, row skipped.`);
      return;
    }

    if (seenDates.has(date)) {
      warnings.push(`Multiple holidays defined for date ${date}. Duplicate merged automatically.`);
      return;
    }

    if (semester && !isWithinRange(date, semester.startDate, semester.endDate)) {
      warnings.push(`Holiday "${name}" (${date}) falls outside the semester date range and was excluded.`);
      return;
    }

    seenDates.add(date);
    holidays.push({
      name,
      date,
      type: String(r.Type || 'National').trim(),
      affectsAttendance: r.AffectsAttendance === 'Yes' || r.AffectsAttendance === true,
      description: String(r.Description || '').trim() || null
    });
  });

  return { holidays, errors, warnings };
}
