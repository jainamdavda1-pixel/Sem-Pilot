/**
 * Time-of-Day and Weekday Analytics Service for SemPilot
 */

export const calculateTimeAnalytics = (loggedLectures = []) => {
  const activeLogs = loggedLectures.filter(l => l.status === "Present" || l.status === "Absent");

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // 1. Weekday Stats
  const weekdayStats = weekdays.map(day => {
    const dayLogs = activeLogs.filter(l => l.dayOfWeek === day);
    const present = dayLogs.filter(l => l.status === "Present").length;
    const total = dayLogs.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { name: day, present, total, percentage };
  });

  // 2. Attendance by Hourly Ranges
  const morningLogs = activeLogs.filter(l => {
    if (!l.startTime) return false;
    const hour = parseInt(l.startTime.split(":")[0], 10);
    return hour < 12;
  });
  const afternoonLogs = activeLogs.filter(l => {
    if (!l.startTime) return false;
    const hour = parseInt(l.startTime.split(":")[0], 10);
    return hour >= 12 && hour < 17;
  });
  const eveningLogs = activeLogs.filter(l => {
    if (!l.startTime) return false;
    const hour = parseInt(l.startTime.split(":")[0], 10);
    return hour >= 17;
  });

  const getPctAndTotal = (logs) => {
    const present = logs.filter(l => l.status === "Present").length;
    const total = logs.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, total, percentage };
  };

  const hourlyRanges = [
    { name: "Morning (Before 12 PM)", ...getPctAndTotal(morningLogs) },
    { name: "Afternoon (12 PM - 5 PM)", ...getPctAndTotal(afternoonLogs) },
    { name: "Evening (After 5 PM)", ...getPctAndTotal(eveningLogs) }
  ];

  // 3. Attendance by Time Slots (Day + Time Combo)
  const slotTotals = {};
  activeLogs.forEach(log => {
    const key = `${log.dayOfWeek} at ${log.startTime}`;
    if (!slotTotals[key]) {
      slotTotals[key] = { name: key, present: 0, total: 0 };
    }
    if (log.status === "Present") slotTotals[key].present++;
    slotTotals[key].total++;
  });

  let mostMissedSlot = "None (No significant absences)";
  let mostMissedRatio = -1;
  let mostAttendedSlot = "None";
  let mostAttendedRatio = -1;

  Object.keys(slotTotals).forEach(key => {
    const { name, present, total } = slotTotals[key];
    if (total >= 2) {
      const attendRatio = present / total;
      const missRatio = (total - present) / total;

      if (missRatio > mostMissedRatio) {
        mostMissedRatio = missRatio;
        mostMissedSlot = `${name} (${Math.round(missRatio * 100)}% missed)`;
      }
      if (attendRatio > mostAttendedRatio) {
        mostAttendedRatio = attendRatio;
        mostAttendedSlot = `${name} (${Math.round(attendRatio * 100)}% attended)`;
      }
    }
  });

  return {
    weekdayStats,
    hourlyRanges,
    mostMissedSlot: mostMissedRatio > 0.1 ? mostMissedSlot : "None (No high absence slots)",
    mostAttendedSlot: mostAttendedRatio > 0 ? mostAttendedSlot : "None"
  };
};
