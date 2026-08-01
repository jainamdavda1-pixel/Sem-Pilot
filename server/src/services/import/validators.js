// Reusable, sheet-agnostic validation helpers shared by the parser modules.

/**
 * Tracks booked time ranges per (day, key) bucket - e.g. per (day, room) or
 * per (day, facultyName) - and reports overlaps in O(1) amortized per lecture
 * instead of the old importer's nested-loop comparison across every lecture.
 */
export class OverlapTracker {
  constructor() {
    this.byDay = new Map(); // day -> Map(bucketKey -> [{start, end, label}])
  }

  /**
   * Register a [start, end) interval under (day, bucketKey). Returns the
   * conflicting entry if one already overlaps, otherwise null.
   */
  check(day, bucketKey, start, end, label) {
    if (!day || !bucketKey) return null;
    if (!this.byDay.has(day)) this.byDay.set(day, new Map());
    const dayMap = this.byDay.get(day);
    if (!dayMap.has(bucketKey)) dayMap.set(bucketKey, []);
    const intervals = dayMap.get(bucketKey);

    const conflict = intervals.find((iv) => start < iv.end && end > iv.start);
    intervals.push({ start, end, label });
    return conflict || null;
  }
}

/** Detects duplicate lecture rows (same day/time/subject/room) using a Set - O(n). */
export class DuplicateLectureDetector {
  constructor() {
    this.seen = new Set();
  }

  /** Returns true if this exact composite key has already been registered. */
  isDuplicate(day, startTime, subjectCode, room) {
    const key = `${day}|${startTime}|${subjectCode}|${room || ''}`;
    if (this.seen.has(key)) return true;
    this.seen.add(key);
    return false;
  }
}

/** True when RepeatWeekly reads as an affirmative value (Yes/true/blank-defaults-true). */
export function parseRepeatWeekly(value) {
  return value === 'Yes' || value === true || value === '' || value === undefined || value === null;
}
