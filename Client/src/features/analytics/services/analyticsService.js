/**
 * Core Analytics Service for SemPilot
 * Computes overall metrics and subject-specific metrics.
 */

// Helper to convert target percentage string/number to decimal
export const parseTargetPercent = (target) => {
  if (typeof target === "string") {
    return parseFloat(target.replace("%", "")) / 100;
  }
  if (typeof target === "number") {
    return target > 1 ? target / 100 : target;
  }
  return 0.75; // Default 75%
};

/**
 * Calculate overall attendance metrics
 */
export const calculateOverallAnalytics = (mergedLectures = [], targetRaw = 75) => {
  const target = parseTargetPercent(targetRaw);
  const loggedLectures = mergedLectures.filter((l) => l.isLogged);

  const presentCount = loggedLectures.filter((l) => l.status === "Present").length;
  const absentCount = loggedLectures.filter((l) => l.status === "Absent").length;
  const cancelledCount = loggedLectures.filter((l) => l.status === "Cancelled").length;
  const holidayCount = loggedLectures.filter((l) => l.status === "Holiday").length;

  const totalActive = presentCount + absentCount;
  const overallAttendancePct = totalActive > 0 ? Math.round((presentCount / totalActive) * 100) : 0;

  // Lecture Durations
  const totalHoursAttended = loggedLectures
    .filter((l) => l.status === "Present")
    .reduce((sum, l) => sum + (l.durationHours || 1), 0);

  const totalHoursMissed = loggedLectures
    .filter((l) => l.status === "Absent")
    .reduce((sum, l) => sum + (l.durationHours || 1), 0);

  const totalLectureHours = totalHoursAttended + totalHoursMissed;

  // Streak calculations (chronological)
  // We sort logged active lectures chronologically to calculate streaks
  const activeLogsChronological = [...loggedLectures]
    .filter((l) => l.status === "Present" || l.status === "Absent")
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  activeLogsChronological.forEach((log) => {
    if (log.status === "Present") {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  });

  // Current streak is evaluated going backwards from the end of the chronological list
  for (let i = activeLogsChronological.length - 1; i >= 0; i--) {
    if (activeLogsChronological[i].status === "Present") {
      currentStreak++;
    } else {
      break;
    }
  }

  // Attendance Improvement %: compares attendance in last 30 days vs before that
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const logsLast30Days = activeLogsChronological.filter((l) => l.date >= thirtyDaysAgoStr);
  const logsPrior = activeLogsChronological.filter((l) => l.date < thirtyDaysAgoStr);

  const present30 = logsLast30Days.filter((l) => l.status === "Present").length;
  const total30 = logsLast30Days.length;
  const pct30 = total30 > 0 ? (present30 / total30) * 100 : null;

  const presentPrior = logsPrior.filter((l) => l.status === "Present").length;
  const totalPrior = logsPrior.length;
  const pctPrior = totalPrior > 0 ? (presentPrior / totalPrior) * 100 : null;

  let attendanceImprovementPct = 0;
  if (pct30 !== null && pctPrior !== null) {
    attendanceImprovementPct = Math.round(pct30 - pctPrior);
  } else if (pct30 !== null && pctPrior === null) {
    // If no prior logs, fallback to first-half vs second-half of logs
    const midPoint = Math.floor(activeLogsChronological.length / 2);
    if (midPoint > 0) {
      const firstHalf = activeLogsChronological.slice(0, midPoint);
      const secondHalf = activeLogsChronological.slice(midPoint);

      const p1 = firstHalf.filter((l) => l.status === "Present").length;
      const pct1 = (p1 / firstHalf.length) * 100;

      const p2 = secondHalf.filter((l) => l.status === "Present").length;
      const pct2 = (p2 / secondHalf.length) * 100;

      attendanceImprovementPct = Math.round(pct2 - pct1);
    }
  }

  return {
    overallAttendancePct,
    totalLectures: loggedLectures.length,
    present: presentCount,
    absent: absentCount,
    cancelled: cancelledCount,
    holidayCount,
    attendanceRequirement: Math.round(target * 100),
    totalLectureHours: Math.round(totalLectureHours * 10) / 10,
    totalHoursAttended: Math.round(totalHoursAttended * 10) / 10,
    totalHoursMissed: Math.round(totalHoursMissed * 10) / 10,
    currentStreak,
    longestStreak,
    attendanceImprovementPct
  };
};

/**
 * Calculate subject-specific analytics
 */
export const calculateSubjectAnalytics = (
  mergedLectures = [],
  subjects = [],
  targetRaw = 75,
  riskEngine, // will be passed dynamically to avoid circular dependencies
  predictionEngine // will be passed dynamically to avoid circular dependencies
) => {
  const target = parseTargetPercent(targetRaw);
  const todayStr = new Date().toISOString().split("T")[0];

  return subjects.map((sub) => {
    const subLectures = mergedLectures.filter(
      (l) => l.subjectName?.toLowerCase() === sub.name?.toLowerCase()
    );

    const logged = subLectures.filter((l) => l.isLogged);
    const present = logged.filter((l) => l.status === "Present").length;
    const absent = logged.filter((l) => l.status === "Absent").length;
    const cancelled = logged.filter((l) => l.status === "Cancelled").length;

    const totalActive = present + absent;
    const attendancePct = totalActive > 0 ? Math.round((present / totalActive) * 100) : 0;

    // Remaining lectures & hours
    const remaining = subLectures.filter((l) => l.status === "Future");
    const remainingLectures = remaining.length;
    const remainingHours = remaining.reduce((sum, l) => sum + (l.durationHours || 1), 0);

    // Splits for theory/lab/tutorial hours
    const theoryHours = logged
      .filter((l) => l.lectureType?.toLowerCase() === "theory" && l.status === "Present")
      .reduce((sum, l) => sum + (l.durationHours || 1), 0);
    const labHours = logged
      .filter((l) => (l.lectureType?.toLowerCase() === "lab" || l.lectureType?.toLowerCase() === "practical") && l.status === "Present")
      .reduce((sum, l) => sum + (l.durationHours || 1), 0);
    const tutorialHours = logged
      .filter((l) => l.lectureType?.toLowerCase() === "tutorial" && l.status === "Present")
      .reduce((sum, l) => sum + (l.durationHours || 1), 0);

    // Average weekly attendance (using logged lectures divided by weeks spanned)
    let avgWeeklyAttendance = totalActive;
    if (logged.length > 0) {
      const dates = logged.map(l => new Date(l.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const msDiff = maxDate - minDate;
      const weeks = Math.max(1, Math.ceil(msDiff / (1000 * 60 * 60 * 24 * 7)));
      avgWeeklyAttendance = Math.round((present / weeks) * 10) / 10;
    }

    // Last 30 day attendance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
    const logged30 = logged.filter((l) => l.date >= thirtyDaysAgoStr);
    const present30 = logged30.filter((l) => l.status === "Present").length;
    const total30Active = logged30.filter((l) => l.status === "Present" || l.status === "Absent").length;
    const last30DayAttendance = total30Active > 0 ? Math.round((present30 / total30Active) * 100) : attendancePct;

    // Monthly breakdown
    const monthlyStats = {};
    logged.forEach((l) => {
      const month = new Date(l.date).toLocaleDateString("en-US", { month: "long" });
      if (!monthlyStats[month]) {
        monthlyStats[month] = { present: 0, active: 0 };
      }
      if (l.status === "Present") {
        monthlyStats[month].present++;
        monthlyStats[month].active++;
      } else if (l.status === "Absent") {
        monthlyStats[month].active++;
      }
    });

    let bestMonth = "N/A";
    let worstMonth = "N/A";
    let bestPct = -1;
    let worstPct = 101;

    Object.keys(monthlyStats).forEach((month) => {
      const { present, active } = monthlyStats[month];
      if (active > 0) {
        const pct = (present / active) * 100;
        if (pct > bestPct) {
          bestPct = pct;
          bestMonth = `${month} (${Math.round(pct)}%)`;
        }
        if (pct < worstPct) {
          worstPct = pct;
          worstMonth = `${month} (${Math.round(pct)}%)`;
        }
      }
    });

    // Subject Trend (based on last 5 lectures)
    const last5Active = [...logged]
      .filter((l) => l.status === "Present" || l.status === "Absent")
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(-5);

    let trend = "stable";
    if (last5Active.length >= 3) {
      const recentPresent = last5Active.filter((l) => l.status === "Present").length;
      const ratio = recentPresent / last5Active.length;
      if (ratio >= 0.8) trend = "up";
      else if (ratio <= 0.4) trend = "down";
    }

    // Can Safely Skip / Need to Attend
    let canSafelySkip = 0;
    let needToAttend = 0;

    if (totalActive > 0) {
      if (attendancePct >= target * 100) {
        canSafelySkip = Math.floor((present - target * totalActive) / target);
        canSafelySkip = Math.max(0, canSafelySkip);
      } else {
        needToAttend = Math.ceil((target * totalActive - present) / (1 - target));
        needToAttend = Math.max(0, needToAttend);
      }
    }

    // Risk Level and Projections computed via Engines if supplied
    const riskScoreObj = riskEngine 
      ? riskEngine.calculateSubjectRisk(attendancePct, remainingLectures, sub.credits || 3, absent, trend)
      : { score: 50, category: "Moderate" };

    const scenarioProjections = predictionEngine
      ? predictionEngine.projectScenarios(present, totalActive, remainingLectures)
      : { finalIfAllAttended: attendancePct, finalIfCurrentContinues: attendancePct };

    return {
      ...sub,
      attendancePct,
      present,
      absent,
      cancelled,
      remainingLectures,
      remainingHours: Math.round(remainingHours * 10) / 10,
      credits: sub.credits || 3,
      theoryHours: Math.round(theoryHours * 10) / 10,
      labHours: Math.round(labHours * 10) / 10,
      tutorialHours: Math.round(tutorialHours * 10) / 10,
      avgWeeklyAttendance,
      last30DayAttendance,
      bestMonth,
      worstMonth,
      riskLevel: riskScoreObj.category,
      riskScore: riskScoreObj.score,
      trend,
      canSafelySkip,
      needToAttend,
      projectedFinalAttendance: Math.round(scenarioProjections.finalIfAllAttended)
    };
  });
};
