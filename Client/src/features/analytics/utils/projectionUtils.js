/**
 * Utility functions for projecting future lectures and merging them with attendance logs.
 */

export const projectSemesterLectures = (semesterInfo, timetableEntries = [], holidays = []) => {
  if (!semesterInfo?.semesterStartDate || !semesterInfo?.semesterEndDate) {
    return [];
  }

  const start = new Date(semesterInfo.semesterStartDate);
  const end = new Date(semesterInfo.semesterEndDate);
  
  const holidaysSet = new Map();
  holidays.forEach(h => {
    if (h.date) {
      const dStr = new Date(h.date).toISOString().split("T")[0];
      holidaysSet.set(dStr, h.name || "Holiday");
    }
  });

  const weekdayMapping = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday"
  };

  const allProjectedLectures = [];

  // Iterate day by day
  let current = new Date(start);
  while (current <= end) {
    const dStr = current.toISOString().split("T")[0];
    const dayOfWeek = weekdayMapping[current.getDay()];

    // Find timetable entries for this day
    const entries = timetableEntries.filter(
      (e) => e.day?.toLowerCase() === dayOfWeek.toLowerCase()
    );

    // Is it a holiday?
    const isHoliday = holidaysSet.has(dStr);
    const holidayName = isHoliday ? holidaysSet.get(dStr) : null;

    entries.forEach(e => {
      // Calculate duration in hours
      let durationHours = 1;
      if (e.startTime && e.endTime) {
        const [sh, sm] = e.startTime.split(":").map(Number);
        const [eh, em] = e.endTime.split(":").map(Number);
        durationHours = Math.max(0.5, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
      }

      allProjectedLectures.push({
        date: dStr,
        dayOfWeek,
        subjectName: e.subjectName,
        lectureType: e.lectureType || "Theory",
        startTime: e.startTime,
        endTime: e.endTime,
        durationHours,
        room: e.room || "",
        facultyName: e.facultyName || "",
        isHoliday,
        holidayName
      });
    });

    current.setDate(current.getDate() + 1);
  }

  return allProjectedLectures;
};

export const mergeLogsAndProjections = (projectedLectures = [], logs = []) => {
  const merged = [];
  const matchedLogKeys = new Set();
  const todayStr = new Date().toISOString().split("T")[0];

  // Map of logs by key
  const logsMap = new Map();
  logs.forEach(log => {
    const key = `${log.date}-${log.subjectName?.trim().toLowerCase()}-${log.startTime}`;
    logsMap.set(key, log);
  });

  // 1. Process all projected lectures
  projectedLectures.forEach(proj => {
    const key = `${proj.date}-${proj.subjectName?.trim().toLowerCase()}-${proj.startTime}`;
    const log = logsMap.get(key);

    if (log) {
      matchedLogKeys.add(key);
      merged.push({
        ...proj,
        id: log.id || `log-${proj.date}-${proj.subjectName}-${proj.startTime}`,
        status: log.status, // "Present", "Absent", "Cancelled", "Holiday"
        isLogged: true,
        remarks: log.remarks || ""
      });
    } else {
      // Determine if it is in the past or future
      const isPast = proj.date < todayStr;
      
      let status = "Future";
      if (proj.isHoliday) {
        status = "Holiday";
      } else if (isPast) {
        status = "Unlogged";
      }

      merged.push({
        ...proj,
        id: `proj-${proj.date}-${proj.subjectName}-${proj.startTime}`,
        status,
        isLogged: false
      });
    }
  });

  // 2. Add any logs that did not match a projected timetable lecture (e.g. extra classes)
  logs.forEach(log => {
    const key = `${log.date}-${log.subjectName?.trim().toLowerCase()}-${log.startTime}`;
    if (!matchedLogKeys.has(key)) {
      let durationHours = 1;
      if (log.startTime && log.endTime) {
        const [sh, sm] = log.startTime.split(":").map(Number);
        const [eh, em] = log.endTime.split(":").map(Number);
        durationHours = Math.max(0.5, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
      }

      merged.push({
        id: log.id || `extra-${log.date}-${log.subjectName}-${log.startTime}`,
        date: log.date,
        dayOfWeek: new Date(log.date).toLocaleDateString("en-US", { weekday: "long" }),
        subjectName: log.subjectName,
        lectureType: log.lectureType || "Theory",
        startTime: log.startTime,
        endTime: log.endTime,
        durationHours,
        room: log.room || "",
        facultyName: log.facultyName || "",
        isHoliday: log.status === "Holiday",
        holidayName: log.status === "Holiday" ? "Holiday" : null,
        status: log.status,
        isLogged: true,
        isExtra: true,
        remarks: log.remarks || ""
      });
    }
  });

  // Sort chronologically
  merged.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  return merged;
};
