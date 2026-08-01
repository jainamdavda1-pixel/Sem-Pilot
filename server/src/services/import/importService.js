// Import orchestrator: wires together excelReader + the per-sheet parsers into
// the full "read workbook -> validated, relationship-resolved domain objects"
// pipeline. This replaces the old single-file parser that only ever looked at
// the first sheet.

import {
  REQUIRED_SHEETS,
  readWorkbookFromBase64,
  findMissingSheets,
  getSheetRows,
  validateSheetColumns
} from './excelReader.js';
import { parseSemesterSheet } from './semesterParser.js';
import { parseFacultySheet } from './facultyParser.js';
import { parseSubjectsSheet } from './subjectParser.js';
import { parseLecturesSheet } from './lectureParser.js';
import { parseHolidaysSheet } from './holidayParser.js';

const SHEET_COLUMNS = {
  Semester: ['Name', 'AcademicYear', 'StartDate', 'EndDate', 'AttendanceRequirement'],
  Faculty: ['FacultyName', 'Department', 'Email', 'Cabin', 'Designation', 'ShortName'],
  Subjects: ['Code', 'SubjectName', 'Type', 'Credits', 'FacultyName'],
  Lectures: ['Day', 'StartTime', 'EndTime', 'SubjectCode', 'FacultyName', 'Room', 'LectureType', 'RepeatWeekly'],
  Holidays: ['Date', 'HolidayName', 'Type', 'AffectsAttendance', 'Description']
};

const emptyResult = (errors, warnings = []) => ({
  semester: null,
  faculties: [],
  subjects: [],
  lectures: [],
  holidays: [],
  errors,
  warnings,
  detectedSubjects: {},
  detectedLectureTypes: {},
  detectedWeekdays: {}
});

/**
 * Full workbook import pipeline.
 * @param {string} base64File - base64-encoded .xlsx file contents.
 * @returns Parsed + validated + relationship-resolved workbook data, in the
 *   same response shape the previous single-file importer produced (so the
 *   existing frontend preview/summary components keep working unmodified).
 */
export function importWorkbook(base64File) {
  const workbook = readWorkbookFromBase64(base64File);

  const missingSheets = findMissingSheets(workbook, REQUIRED_SHEETS);
  if (missingSheets.length > 0) {
    return emptyResult([`Missing sheets: ${missingSheets.join(', ')}`]);
  }

  // Step 1: read every sheet up front, by name - never assume sheet order/position.
  const rawRows = {};
  const columnErrors = [];
  for (const sheetName of REQUIRED_SHEETS) {
    const rows = getSheetRows(workbook, sheetName);
    const columnError = validateSheetColumns(sheetName, rows, SHEET_COLUMNS[sheetName]);
    if (columnError) columnErrors.push(columnError);
    rawRows[sheetName] = rows;
  }

  if (columnErrors.length > 0) {
    return emptyResult(columnErrors);
  }

  // Step 2: Semester (everything else is validated relative to it).
  const semesterResult = parseSemesterSheet(rawRows.Semester);

  // Step 3: Faculty.
  const facultyResult = parseFacultySheet(rawRows.Faculty);

  // Step 4: Subjects (resolves FacultyName -> Faculty).
  const subjectResult = parseSubjectsSheet(rawRows.Subjects, facultyResult.facultyMap);

  // Step 5-8: Lectures (resolves SubjectCode -> Subject, FacultyName -> Faculty,
  // normalizes day/time, computes duration + slot indexes, detects conflicts).
  const lectureResult = parseLecturesSheet(rawRows.Lectures, subjectResult.subjectMap, facultyResult.facultyMap);

  // Step 9-10: Holidays (rejects/flags holidays outside the semester's date range).
  const holidayResult = parseHolidaysSheet(rawRows.Holidays, semesterResult.semester);

  const errors = [
    ...semesterResult.errors,
    ...facultyResult.errors,
    ...subjectResult.errors,
    ...lectureResult.errors,
    ...holidayResult.errors
  ];
  const warnings = [
    ...facultyResult.warnings,
    ...subjectResult.warnings,
    ...lectureResult.warnings,
    ...holidayResult.warnings
  ];

  return {
    semester: semesterResult.semester,
    faculties: facultyResult.faculties,
    subjects: subjectResult.subjects,
    lectures: lectureResult.lectures,
    holidays: holidayResult.holidays,
    errors,
    warnings,
    detectedSubjects: subjectResult.detectedSubjects,
    detectedLectureTypes: lectureResult.detectedLectureTypes,
    detectedWeekdays: lectureResult.detectedWeekdays
  };
}
