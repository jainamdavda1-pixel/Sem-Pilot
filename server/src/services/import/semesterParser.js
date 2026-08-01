import { parseExcelDate } from './dateUtils.js';

/**
 * Parse the Semester sheet (single-row metadata sheet).
 * @returns {{ semester: object|null, errors: string[] }}
 */
export function parseSemesterSheet(rows) {
  const errors = [];

  if (rows.length === 0) {
    errors.push('Semester sheet is empty. Provide exactly one row of semester metadata.');
    return { semester: null, errors };
  }

  const row = rows[0];
  const name = String(row.Name || '').trim();
  const startDate = parseExcelDate(row.StartDate);
  const endDate = parseExcelDate(row.EndDate);

  if (!name) errors.push('Semester sheet: "Name" is required.');
  if (!startDate) errors.push(`Semester sheet: "StartDate" is missing or invalid (got "${row.StartDate}").`);
  if (!endDate) errors.push(`Semester sheet: "EndDate" is missing or invalid (got "${row.EndDate}").`);
  if (startDate && endDate && new Date(startDate).getTime() >= new Date(endDate).getTime()) {
    errors.push('Semester sheet: "StartDate" must be before "EndDate".');
  }

  const attendanceRequirement = parseInt(row.AttendanceRequirement, 10);

  const semester = {
    name,
    academicYear: String(row.AcademicYear || '').trim(),
    startDate,
    endDate,
    attendanceRequirement: Number.isFinite(attendanceRequirement) ? attendanceRequirement : 75
  };

  return { semester, errors };
}
