// Reads and validates the raw workbook structure. Nothing here knows about
// Semester/Faculty/Subject/Lecture/Holiday business rules - purely sheet plumbing.

import * as XLSX from 'xlsx';

export const REQUIRED_SHEETS = ['Semester', 'Faculty', 'Subjects', 'Lectures', 'Holidays'];

/** Parse a base64-encoded .xlsx buffer into a workbook. Throws on invalid input. */
export function readWorkbookFromBase64(base64) {
  if (!base64) {
    throw new Error('Excel file base64 data is required');
  }
  try {
    const buffer = Buffer.from(base64, 'base64');
    return XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    throw new Error(`Invalid Excel file buffer: ${err.message}`);
  }
}

/** Sheets from `requiredSheets` that are absent from the workbook, by name (order-independent). */
export function findMissingSheets(workbook, requiredSheets = REQUIRED_SHEETS) {
  return requiredSheets.filter((name) => !workbook.SheetNames.includes(name));
}

/** Read a named sheet's rows as an array of plain objects keyed by header. */
export function getSheetRows(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

/** Validate that a sheet's header row contains every column in `requiredColumns`. */
export function validateSheetColumns(sheetName, rows, requiredColumns) {
  if (rows.length === 0) return null;
  const headers = Object.keys(rows[0]);
  const missing = requiredColumns.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    return `Sheet "${sheetName}" is missing required columns: ${missing.join(', ')}`;
  }
  return null;
}
