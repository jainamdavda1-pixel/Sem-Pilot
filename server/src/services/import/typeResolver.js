// Shared subject/lecture "academic type" resolution logic.
// Used by both subjectParser and lectureParser so the inference rules live in
// exactly one place (avoids the old duplicated, LAB/TUTORIAL-only heuristics).

export const ACADEMIC_TYPES = [
  'THEORY',
  'LAB',
  'TUTORIAL',
  'WORKSHOP',
  'PRACTICAL',
  'SEMINAR',
  'PROJECT'
];

// Checked in order, most-specific keyword first, so e.g. "Laboratory Practical"
// with an explicit Type of "LAB" still resolves to LAB rather than PRACTICAL.
const KEYWORD_MAP = [
  ['TUTORIAL', 'TUTORIAL'],
  ['WORKSHOP', 'WORKSHOP'],
  ['SEMINAR', 'SEMINAR'],
  ['PROJECT', 'PROJECT'],
  ['PRACTICAL', 'PRACTICAL'],
  ['LAB', 'LAB']
];

/**
 * Resolve an academic type (subject Type or lecture LectureType) from a list of
 * candidate strings, checked in priority order (e.g. explicit column first,
 * then subject type, then subject/lecture name as a last resort).
 * Falls back to THEORY when nothing matches, never collapses unknown types silently.
 */
export function resolveAcademicType(...sources) {
  for (const raw of sources) {
    if (!raw) continue;
    const upper = String(raw).trim().toUpperCase();
    if (!upper) continue;
    for (const [keyword, type] of KEYWORD_MAP) {
      if (upper.includes(keyword)) return type;
    }
  }
  return 'THEORY';
}

export function isKnownAcademicType(raw) {
  if (!raw) return false;
  return ACADEMIC_TYPES.includes(String(raw).trim().toUpperCase());
}
