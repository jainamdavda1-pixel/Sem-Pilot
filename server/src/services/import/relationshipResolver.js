// Resolves the cross-sheet references used by the workbook: SubjectCode -> Subject
// and FacultyName -> Faculty. Centralized here so lectureParser (and any future
// consumer) doesn't reimplement the lookup/normalization rules.

/** Look up a subject by SubjectCode (case-insensitive). Returns undefined if unknown. */
export function resolveSubject(code, subjectMap) {
  if (!code || !subjectMap) return undefined;
  return subjectMap.get(String(code).trim().toUpperCase());
}

/** Look up a faculty by FacultyName (case-insensitive). Returns undefined if unknown. */
export function resolveFaculty(name, facultyMap) {
  if (!name || !facultyMap) return undefined;
  return facultyMap.get(String(name).trim().toLowerCase());
}
