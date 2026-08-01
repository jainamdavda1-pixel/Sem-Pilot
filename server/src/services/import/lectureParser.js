import { parseTimeToMinutes, minutesToHHMM } from './timeUtils.js';
import { normalizeDay, WEEKDAY_DISPLAY, WEEKDAYS } from './dayUtils.js';
import { computeSlots } from './slotCalculator.js';
import { resolveAcademicType } from './typeResolver.js';
import { resolveSubject, resolveFaculty } from './relationshipResolver.js';
import { OverlapTracker, DuplicateLectureDetector, parseRepeatWeekly } from './validators.js';

/**
 * Parse the Lectures sheet into fully-resolved lecture objects.
 *
 * Each lecture is enriched with: resolved subjectName/facultyName, a
 * normalized lectureType (7-way enum, not just Theory/Lab), an accurately
 * computed duration + slotIndexes derived from its own StartTime/EndTime
 * (never a hardcoded per-type duration), and relationship + scheduling
 * validation against the Subjects/Faculty sheets.
 *
 * @returns {{ lectures: object[], errors: string[], warnings: string[], detectedLectureTypes: object, detectedWeekdays: object }}
 */
export function parseLecturesSheet(rows, subjectMap, facultyMap) {
  const errors = [];
  const warnings = [];
  const lectures = [];

  const detectedLectureTypes = {};
  const detectedWeekdays = {};
  WEEKDAYS.forEach((d) => (detectedWeekdays[WEEKDAY_DISPLAY[d]] = 0));

  const roomOverlaps = new OverlapTracker();
  const facultyOverlaps = new OverlapTracker();
  const duplicates = new DuplicateLectureDetector();

  // Excel merged-cell "Day" columns often leave the day blank on continuation rows;
  // carry the last explicit day forward the way a human reading the sheet would.
  let lastValidDay = '';

  rows.forEach((r, idx) => {
    const rowNum = idx + 2;
    const code = String(r.SubjectCode || '').trim().toUpperCase();

    if (!code) {
      warnings.push(`Lectures sheet row ${rowNum}: missing SubjectCode, row skipped.`);
      return;
    }

    const rawDay = String(r.Day || '').trim();
    const dayInput = rawDay || lastValidDay;
    const day = normalizeDay(dayInput);
    if (rawDay) lastValidDay = rawDay;

    const startMinutes = parseTimeToMinutes(r.StartTime);
    const endMinutes = parseTimeToMinutes(r.EndTime);
    const startTime = minutesToHHMM(startMinutes);
    const endTime = minutesToHHMM(endMinutes);

    const rawFacultyName = String(r.FacultyName || '').trim();

    const subject = resolveSubject(code, subjectMap);
    if (!subject) {
      errors.push(`Lecture row ${rowNum} (${code}): refers to unknown Subject Code "${code}".`);
    }

    const faculty = rawFacultyName ? resolveFaculty(rawFacultyName, facultyMap) : undefined;
    if (rawFacultyName && !faculty) {
      errors.push(`Lecture row ${rowNum} (${code}): refers to unknown Faculty "${rawFacultyName}".`);
    }
    // Use the Faculty sheet's exact spelling so preview dropdowns and DB linkage
    // always find an exact match, regardless of minor casing/spacing differences
    // between how the name was typed in the Lectures sheet vs. the Faculty sheet.
    const facultyName = faculty?.name || subject?.facultyName || rawFacultyName || null;

    if (!day) {
      errors.push(`Lecture row ${rowNum} (${code}): invalid or missing Day "${r.Day ?? ''}".`);
    } else {
      detectedWeekdays[WEEKDAY_DISPLAY[day]]++;
    }

    if (startMinutes === null) {
      errors.push(`Lecture row ${rowNum} (${code}): invalid or missing StartTime "${r.StartTime}".`);
    }
    if (endMinutes === null) {
      errors.push(`Lecture row ${rowNum} (${code}): invalid or missing EndTime "${r.EndTime}".`);
    }

    let duration = 0;
    let slotIndexes = [];
    if (startMinutes !== null && endMinutes !== null) {
      if (endMinutes <= startMinutes) {
        errors.push(
          `Lecture row ${rowNum} (${code}): EndTime (${endTime}) must be after StartTime (${startTime}).`
        );
      } else {
        const slots = computeSlots(startMinutes, endMinutes);
        duration = slots.duration;
        slotIndexes = slots.slotIndexes;
      }
    }

    const rawType = String(r.LectureType || '').trim();
    const lectureType = resolveAcademicType(rawType, subject?.type, subject?.name);
    detectedLectureTypes[lectureType] = (detectedLectureTypes[lectureType] || 0) + 1;

    const room = String(r.Room || '').trim() || null;

    if (day && startTime && duplicates.isDuplicate(day, startTime, code, room)) {
      errors.push(`Duplicate lecture entry detected at row ${rowNum}: ${code} on ${day} at ${startTime}.`);
    }

    // Overlap detection - only meaningful once day/time are both valid
    if (day && startMinutes !== null && endMinutes !== null && endMinutes > startMinutes) {
      if (room) {
        const conflict = roomOverlaps.check(day, room, startMinutes, endMinutes, code);
        if (conflict) {
          warnings.push(
            `Overlap: Room "${room}" is double-booked on ${WEEKDAY_DISPLAY[day]} at ${startTime}-${endTime} (overlaps with ${conflict.label}).`
          );
        }
      }
      if (facultyName) {
        const conflict = facultyOverlaps.check(
          day,
          facultyName.toLowerCase(),
          startMinutes,
          endMinutes,
          code
        );
        if (conflict) {
          warnings.push(
            `Overlap: Faculty "${facultyName}" is scheduled for multiple lectures on ${WEEKDAY_DISPLAY[day]} at ${startTime}-${endTime} (overlaps with ${conflict.label}).`
          );
        }
      }
    }

    lectures.push({
      id: `L${rowNum}`,
      subjectCode: code,
      subjectName: subject?.name || null,
      facultyName: facultyName || subject?.facultyName || null,
      lectureType,
      room,
      // `weekday` kept as the canonical field name for backward compatibility with
      // existing preview/dashboard UI; `day` is provided as an alias.
      weekday: day || dayInput.toUpperCase(),
      day: day || dayInput.toUpperCase(),
      startTime,
      endTime,
      duration,
      slotIndexes,
      repeatWeekly: parseRepeatWeekly(r.RepeatWeekly)
    });
  });

  return { lectures, errors, warnings, detectedLectureTypes, detectedWeekdays };
}
