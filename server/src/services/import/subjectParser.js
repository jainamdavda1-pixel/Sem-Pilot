import { resolveAcademicType } from './typeResolver.js';
import { resolveFaculty } from './relationshipResolver.js';

/**
 * Parse the Subjects sheet into a list of subject objects plus a lookup map
 * (uppercased SubjectCode -> subject object) used by relationshipResolver.
 * Resolves each subject's FacultyName against the Faculty sheet's facultyMap.
 * @returns {{ subjects: object[], subjectMap: Map<string, object>, errors: string[], warnings: string[], detectedSubjects: object }}
 */
export function parseSubjectsSheet(rows, facultyMap) {
  const errors = [];
  const warnings = [];
  const subjects = [];
  const subjectMap = new Map();
  const detectedSubjects = {};

  rows.forEach((r, idx) => {
    const rowNum = idx + 2;
    const code = String(r.Code || '').trim().toUpperCase();
    const name = String(r.SubjectName || '').trim();

    if (!code || !name) {
      warnings.push(`Subjects sheet row ${rowNum}: missing Code or SubjectName, row skipped.`);
      return;
    }

    if (subjectMap.has(code)) {
      errors.push(`Duplicate subject code detected in Subjects sheet: "${code}" (row ${rowNum}).`);
      return;
    }

    const rawFacultyName = String(r.FacultyName || '').trim();
    const faculty = rawFacultyName ? resolveFaculty(rawFacultyName, facultyMap) : undefined;
    if (rawFacultyName && !faculty) {
      errors.push(`Subject "${code}" (row ${rowNum}): refers to unknown Faculty "${rawFacultyName}".`);
    }
    // Use the Faculty sheet's exact spelling (not the possibly differently-cased/
    // spaced text typed into the Subjects sheet) so this reliably matches the
    // faculty list everywhere downstream (preview dropdowns, DB linkage).
    const facultyName = faculty?.name || rawFacultyName || null;

    const type = resolveAcademicType(r.Type, name);
    detectedSubjects[type] = (detectedSubjects[type] || 0) + 1;

    const credits = parseInt(r.Credits, 10);

    const subject = {
      code,
      name,
      type,
      credits: Number.isFinite(credits) ? credits : 3,
      facultyName
    };

    subjects.push(subject);
    subjectMap.set(code, subject);
  });

  return { subjects, subjectMap, errors, warnings, detectedSubjects };
}
