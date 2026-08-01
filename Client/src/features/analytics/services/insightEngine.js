/**
 * Insight Engine for SemPilot
 * Dynamically computes actionable, data-driven insights.
 */

export const generateInsights = (loggedLectures = [], subjectStats = [], overallStats = {}) => {
  const insights = [];
  const activeLogs = loggedLectures.filter((l) => l.status === "Present" || l.status === "Absent");
  
  if (activeLogs.length === 0) {
    insights.push({
      type: "info",
      title: "Get Started Logging",
      text: "Log your daily class attendance on the Dashboard to start generating smart academic insights."
    });
    return insights;
  }

  // 1. Recent Trend Insight
  if (overallStats.attendanceImprovementPct > 3) {
    insights.push({
      type: "success",
      title: "Attendance on the Rise!",
      text: `Your overall attendance has improved by ${overallStats.attendanceImprovementPct}% recently. Excellent work, keep up the momentum!`
    });
  } else if (overallStats.attendanceImprovementPct < -3) {
    insights.push({
      type: "warning",
      title: "Recent Attendance Drop",
      text: `Your attendance rate has slipped by ${Math.abs(overallStats.attendanceImprovementPct)}% recently. Try to attend your next few lectures to avoid falling behind.`
    });
  }

  // 2. Risk Areas (Subjects below requirement)
  const targetPct = overallStats.attendanceRequirement || 75;
  const subjectsBelow = subjectStats.filter((s) => s.total > 0 && s.attendancePct < targetPct);
  if (subjectsBelow.length > 0) {
    const list = subjectsBelow.map(s => s.name).join(", ");
    insights.push({
      type: "warning",
      title: "Below Target Threshold",
      text: `You are currently below your target of ${targetPct}% in ${subjectsBelow.length} course(s): ${list}. Prioritize these subjects next.`
    });
  }

  // 3. Peak Absentee Weekdays
  const weekdayTotals = {};
  activeLogs.forEach((log) => {
    const day = log.dayOfWeek;
    if (!weekdayTotals[day]) {
      weekdayTotals[day] = { present: 0, total: 0 };
    }
    if (log.status === "Present") weekdayTotals[day].present++;
    weekdayTotals[day].total++;
  });

  let worstDay = null;
  let worstDayRate = 0;

  Object.keys(weekdayTotals).forEach((day) => {
    const { present, total } = weekdayTotals[day];
    if (total >= 2) {
      const absentRate = ((total - present) / total) * 100;
      if (absentRate > worstDayRate) {
        worstDayRate = absentRate;
        worstDay = day;
      }
    }
  });

  if (worstDay && worstDayRate >= 20) {
    insights.push({
      type: "warning",
      title: "Weekday Attendance Pattern",
      text: `Your absence rate peaks on ${worstDay}s at ${Math.round(worstDayRate)}%. Watch out for absences around this day of the week.`
    });
  }

  // 4. Morning vs Afternoon
  const morningLogs = activeLogs.filter((l) => {
    if (!l.startTime) return false;
    const hour = parseInt(l.startTime.split(":")[0], 10);
    return hour < 12;
  });
  const afternoonLogs = activeLogs.filter((l) => {
    if (!l.startTime) return false;
    const hour = parseInt(l.startTime.split(":")[0], 10);
    return hour >= 12;
  });

  const getPct = (logs) => {
    const present = logs.filter(l => l.status === "Present").length;
    return logs.length > 0 ? (present / logs.length) * 100 : null;
  };

  const morningPct = getPct(morningLogs);
  const afternoonPct = getPct(afternoonLogs);

  if (morningPct !== null && afternoonPct !== null) {
    if (afternoonPct - morningPct > 8) {
      insights.push({
        type: "info",
        title: "Morning Class Slump",
        text: `Morning classes (before 12 PM) have lower attendance (${Math.round(morningPct)}%) than afternoon classes (${Math.round(afternoonPct)}%). Try to build a better morning routine!`
      });
    }
  }

  // 5. Consistency Champion (Subject Streaks)
  let bestStreakSub = null;
  let bestStreakVal = 0;

  subjectStats.forEach((sub) => {
    const subLogs = activeLogs
      .filter((l) => l.subjectName?.toLowerCase() === sub.name?.toLowerCase())
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    
    let currentStreak = 0;
    let maxStreak = 0;
    subLogs.forEach((l) => {
      if (l.status === "Present") {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    if (maxStreak > bestStreakVal) {
      bestStreakVal = maxStreak;
      bestStreakSub = sub.name;
    }
  });

  if (bestStreakSub && bestStreakVal >= 4) {
    insights.push({
      type: "success",
      title: "Consistency Champion",
      text: `You have logged ${bestStreakVal} consecutive present marks in ${bestStreakSub}! This is your most stable subject.`
    });
  }

  // 6. Lab Benefits
  const labLogs = activeLogs.filter(l => l.lectureType?.toLowerCase() === "lab" || l.lectureType?.toLowerCase() === "practical");
  const theoryLogs = activeLogs.filter(l => l.lectureType?.toLowerCase() === "theory");

  const labPct = getPct(labLogs);
  const theoryPct = getPct(theoryLogs);

  if (labPct !== null && theoryPct !== null && labPct - theoryPct > 5) {
    insights.push({
      type: "success",
      title: "Lab Attendance Advantage",
      text: `Your lab attendance rate (${Math.round(labPct)}%) is significantly higher than your theory lecture rate (${Math.round(theoryPct)}%). Interactive learning keeps you engaged!`
    });
  }

  return insights;
};
