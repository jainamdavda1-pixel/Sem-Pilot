// Date parsing utilities for the workbook importer.
// Handles Excel date serials, JS Date objects (when xlsx is read with cellDates),
// and common textual date formats, normalizing everything to an ISO "YYYY-MM-DD" string.

const EXCEL_EPOCH_OFFSET_DAYS = 25569; // Days between 1899-12-30 (Excel epoch) and 1970-01-01
const MS_PER_DAY = 86400 * 1000;

/**
 * Normalize any supported date input into an ISO "YYYY-MM-DD" string.
 * Returns null when the value cannot be parsed.
 */
export function parseExcelDate(value) {
  if (value === undefined || value === null || value === '') return null;

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'number') {
    if (!isFinite(value)) return null;
    const date = new Date(Math.round((value - EXCEL_EPOCH_OFFSET_DAYS) * MS_PER_DAY));
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  }

  const str = String(value).trim();
  if (!str) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    const d = new Date(`${year}-${month}-${day}T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, '0');
    const day = ymd[3].padStart(2, '0');
    const d = new Date(`${year}-${month}-${day}T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback.toISOString().split('T')[0];
}

/** True if `date` (ISO string) falls within [start, end] inclusive, when both bounds are known. */
export function isWithinRange(dateStr, startStr, endStr) {
  if (!dateStr || !startStr || !endStr) return true; // Can't validate without full range info
  const d = new Date(dateStr).getTime();
  const s = new Date(startStr).getTime();
  const e = new Date(endStr).getTime();
  if (isNaN(d) || isNaN(s) || isNaN(e)) return true;
  return d >= s && d <= e;
}
