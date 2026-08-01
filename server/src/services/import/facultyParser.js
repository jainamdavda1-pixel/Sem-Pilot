/**
 * Parse the Faculty sheet into a list of faculty objects plus a lookup map
 * (lower-cased FacultyName -> faculty object) used by relationshipResolver.
 * @returns {{ faculties: object[], facultyMap: Map<string, object>, errors: string[], warnings: string[] }}
 */
export function parseFacultySheet(rows) {
  const errors = [];
  const warnings = [];
  const faculties = [];
  const facultyMap = new Map();

  rows.forEach((r, idx) => {
    const rowNum = idx + 2; // +1 for 0-index, +1 for header row
    const name = String(r.FacultyName || '').trim();
    if (!name) {
      warnings.push(`Faculty sheet row ${rowNum}: missing FacultyName, row skipped.`);
      return;
    }

    const key = name.toLowerCase();
    if (facultyMap.has(key)) {
      warnings.push(`Faculty "${name}" is duplicated in the Faculty sheet. Duplicate merged automatically.`);
      return;
    }

    const faculty = {
      name,
      department: String(r.Department || '').trim() || 'General Academics',
      email: String(r.Email || '').trim() || null,
      cabin: String(r.Cabin || '').trim() || null,
      designation: String(r.Designation || '').trim() || null,
      shortName: String(r.ShortName || '').trim() || null
    };

    faculties.push(faculty);
    facultyMap.set(key, faculty);
  });

  return { faculties, facultyMap, errors, warnings };
}
