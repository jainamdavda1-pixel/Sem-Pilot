/**
 * Achievement Engine for SemPilot
 * Automatically unlocks badges based on attendance records.
 */

// Helper to get week key (YYYY-Www)
export const getWeekKey = (dateStr) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  // Get ISO week number
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
  return `${year}-W${weekNum}`;
};

export const evaluateAchievements = (loggedLectures = [], overallPct = 0) => {
  const activeLogs = loggedLectures
    .filter((l) => l.status === "Present" || l.status === "Absent")
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const achievements = [
    {
      id: "perfect-week",
      title: "Perfect Week",
      description: "Attended every single lecture scheduled in a single week (min 5 classes).",
      icon: "Award",
      unlocked: false,
      date: null
    },
    {
      id: "90-club",
      title: "90% Club",
      description: "Maintained an overall attendance rate of 90% or above (min 10 classes).",
      icon: "TrendingUp",
      unlocked: false,
      date: null
    },
    {
      id: "attendance-streak",
      title: "Super Streak",
      description: "Achieved a streak of 7 or more consecutive attended classes.",
      icon: "Zap",
      unlocked: false,
      date: null
    },
    {
      id: "never-miss-monday",
      title: "Never Miss Monday",
      description: "Attended every Monday class for at least 3 weeks.",
      icon: "Calendar",
      unlocked: false,
      date: null
    },
    {
      id: "lab-master",
      title: "Lab Master",
      description: "Maintained 100% attendance across all lab/practical sessions (min 3 labs).",
      icon: "FlaskConical",
      unlocked: false,
      date: null
    },
    {
      id: "consistency-champion",
      title: "Consistency Champion",
      description: "Attended all lectures scheduled over two consecutive weeks (min 6 classes).",
      icon: "ShieldAlert",
      unlocked: false,
      date: null
    }
  ];

  if (activeLogs.length === 0) return achievements;

  // 1. Evaluate "90% Club"
  if (activeLogs.length >= 10 && overallPct >= 90) {
    achievements[1].unlocked = true;
    achievements[1].date = activeLogs[activeLogs.length - 1].date;
  }

  // 2. Evaluate "Super Streak" (streak >= 7)
  let currentStreak = 0;
  let hasStreakUnlocked = false;
  let streakDate = null;
  activeLogs.forEach((log) => {
    if (log.status === "Present") {
      currentStreak++;
      if (currentStreak >= 7) {
        hasStreakUnlocked = true;
        streakDate = log.date;
      }
    } else {
      currentStreak = 0;
    }
  });
  if (hasStreakUnlocked) {
    achievements[2].unlocked = true;
    achievements[2].date = streakDate;
  }

  // Group logs by week for week-based badges
  const logsByWeek = {};
  activeLogs.forEach((log) => {
    const weekKey = getWeekKey(log.date);
    if (!logsByWeek[weekKey]) logsByWeek[weekKey] = [];
    logsByWeek[weekKey].push(log);
  });

  // 3. Evaluate "Perfect Week"
  let perfectWeekDate = null;
  Object.keys(logsByWeek).forEach((week) => {
    const weekLogs = logsByWeek[week];
    const total = weekLogs.length;
    const present = weekLogs.filter((l) => l.status === "Present").length;
    if (total >= 5 && present === total) {
      perfectWeekDate = weekLogs[total - 1].date;
    }
  });
  if (perfectWeekDate) {
    achievements[0].unlocked = true;
    achievements[0].date = perfectWeekDate;
  }

  // 4. Evaluate "Never Miss Monday"
  const mondayLogs = activeLogs.filter(l => l.dayOfWeek === "Monday");
  const mondayLogsByWeek = {};
  mondayLogs.forEach(l => {
    const wk = getWeekKey(l.date);
    if (!mondayLogsByWeek[wk]) mondayLogsByWeek[wk] = [];
    mondayLogsByWeek[wk].push(l);
  });

  const mondayWeeks = Object.keys(mondayLogsByWeek);
  if (mondayWeeks.length >= 3) {
    const allMondaysAttended = mondayWeeks.every(wk => 
      mondayLogsByWeek[wk].every(l => l.status === "Present")
    );
    if (allMondaysAttended) {
      achievements[3].unlocked = true;
      achievements[3].date = mondayLogs[mondayLogs.length - 1].date;
    }
  }

  // 5. Evaluate "Lab Master"
  const labLogs = activeLogs.filter(
    (l) => l.lectureType?.toLowerCase() === "lab" || l.lectureType?.toLowerCase() === "practical"
  );
  if (labLogs.length >= 3) {
    const allLabsPresent = labLogs.every((l) => l.status === "Present");
    if (allLabsPresent) {
      achievements[4].unlocked = true;
      achievements[4].date = labLogs[labLogs.length - 1].date;
    }
  }

  // 6. Evaluate "Consistency Champion" (Attended all classes in 2 consecutive weeks)
  const weekKeysSorted = Object.keys(logsByWeek).sort();
  let consistencyDate = null;
  for (let i = 0; i < weekKeysSorted.length - 1; i++) {
    const w1Logs = logsByWeek[weekKeysSorted[i]];
    const w2Logs = logsByWeek[weekKeysSorted[i + 1]];
    
    const w1AllPresent = w1Logs.every(l => l.status === "Present");
    const w2AllPresent = w2Logs.every(l => l.status === "Present");
    
    if (w1AllPresent && w2AllPresent && (w1Logs.length + w2Logs.length) >= 6) {
      consistencyDate = w2Logs[w2Logs.length - 1].date;
      break;
    }
  }
  if (consistencyDate) {
    achievements[5].unlocked = true;
    achievements[5].date = consistencyDate;
  }

  return achievements;
};
