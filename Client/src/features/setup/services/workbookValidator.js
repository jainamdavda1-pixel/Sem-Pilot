export function validateWorkbookDataset(semester, faculties, subjects, lectures, holidays) {
  const errors = [];
  const warnings = [];

  if (!semester || !semester.name || !semester.startDate || !semester.endDate) {
    errors.push("Semester info is incomplete. Name, Start Date, and End Date are required.");
  }

  // Duplicate subject codes
  const codes = (subjects || []).map(s => s.code?.trim().toUpperCase());
  const dupeCodes = codes.filter((c, i) => codes.indexOf(c) !== i);
  if (dupeCodes.length > 0) {
    errors.push(`Duplicate subject codes: ${[...new Set(dupeCodes)].join(", ")}`);
  }

  // Lectures validation
  const facultyNames = new Set((faculties || []).map(f => f.name?.trim().toLowerCase()));
  const subjectCodes = new Set((subjects || []).map(s => s.code?.trim().toUpperCase()));

  const parseTime = (str) => {
    if (!str) return 0;
    const parts = String(str).split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const roomSchedules = {};
  const facultySchedules = {};

  (lectures || []).forEach((lec, idx) => {
    const start = parseTime(lec.startTime);
    const end = parseTime(lec.endTime);
    const day = lec.weekday?.toUpperCase().trim();
    const code = lec.subjectCode?.trim().toUpperCase();

    if (start >= end && start > 0) {
      errors.push(`Lecture #${idx + 1} (${code}): Start time (${lec.startTime}) must be before End time (${lec.endTime})`);
    }

    if (code && !subjectCodes.has(code)) {
      errors.push(`Lecture #${idx + 1} (${code}): Refers to unknown Subject Code "${code}"`);
    }

    if (lec.facultyName && !facultyNames.has(lec.facultyName.trim().toLowerCase())) {
      errors.push(`Lecture #${idx + 1} (${code}): Refers to unknown Faculty "${lec.facultyName}"`);
    }

    if (day && start < end) {
      // Room overlaps
      if (lec.room) {
        if (!roomSchedules[day]) roomSchedules[day] = {};
        if (!roomSchedules[day][lec.room]) roomSchedules[day][lec.room] = [];

        const conflict = roomSchedules[day][lec.room].find(s => start < s.end && end > s.start);
        if (conflict) {
          warnings.push(`Overlap: Room "${lec.room}" is double-booked on ${lec.weekday} at ${lec.startTime}-${lec.endTime} (overlaps with ${conflict.sub})`);
        }
        roomSchedules[day][lec.room].push({ start, end, sub: code });
      }

      // Faculty overlaps
      if (lec.facultyName) {
        if (!facultySchedules[day]) facultySchedules[day] = {};
        const fClean = lec.facultyName.trim().toLowerCase();
        if (!facultySchedules[day][fClean]) facultySchedules[day][fClean] = [];

        const conflict = facultySchedules[day][fClean].find(s => start < s.end && end > s.start);
        if (conflict) {
          warnings.push(`Overlap: Faculty "${lec.facultyName}" is scheduled for multiple lectures on ${lec.weekday} at ${lec.startTime}-${lec.endTime} (overlaps with ${conflict.sub})`);
        }
        facultySchedules[day][fClean].push({ start, end, sub: code });
      }
    }
  });

  return { errors, warnings };
}
