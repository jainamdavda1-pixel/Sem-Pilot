/**
 * Report Generator and Exporter Service for SemPilot
 */

import { getWeekKey } from "./achievementEngine.js";

/**
 * Generate weekly reports from logs
 */
export const generateWeeklyReports = (loggedLectures = []) => {
  const activeLogs = loggedLectures.filter(l => l.status === "Present" || l.status === "Absent");
  const weeklyMap = {};

  activeLogs.forEach(log => {
    const wk = getWeekKey(log.date);
    if (!weeklyMap[wk]) {
      weeklyMap[wk] = { week: wk, present: 0, absent: 0, logs: [] };
    }
    if (log.status === "Present") weeklyMap[wk].present++;
    else if (log.status === "Absent") weeklyMap[wk].absent++;
    weeklyMap[wk].logs.push(log);
  });

  return Object.keys(weeklyMap).map(wk => {
    const { present, absent, logs } = weeklyMap[wk];
    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      week: wk,
      present,
      absent,
      total,
      percentage,
      logsCount: logs.length
    };
  }).sort((a, b) => b.week.localeCompare(a.week)); // Recent first
};

/**
 * Generate monthly reports from logs
 */
export const generateMonthlyReports = (loggedLectures = []) => {
  const activeLogs = loggedLectures.filter(l => l.status === "Present" || l.status === "Absent");
  const monthlyMap = {};

  activeLogs.forEach(log => {
    const dateObj = new Date(log.date);
    const monthKey = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, present: 0, absent: 0, logs: [] };
    }
    if (log.status === "Present") monthlyMap[monthKey].present++;
    else if (log.status === "Absent") monthlyMap[monthKey].absent++;
    monthlyMap[monthKey].logs.push(log);
  });

  return Object.keys(monthlyMap).map(month => {
    const { present, absent, logs } = monthlyMap[month];
    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      month,
      present,
      absent,
      total,
      percentage,
      logsCount: logs.length
    };
  });
};

/**
 * Trigger CSV export of analytics
 */
export const exportToCSV = (subjectStats = [], overallStats = {}) => {
  let csvContent = "Subject Name,Credits,Present,Absent,Cancelled,Attendance Pct,Risk Level,Remaining Lectures,Projected Final Attendance Pct\n";
  
  subjectStats.forEach(s => {
    csvContent += `"${s.name}",${s.credits},${s.present},${s.absent},${s.cancelled},${s.attendancePct}%,${s.riskLevel},${s.remainingLectures},${s.projectedFinalAttendance}%\n`;
  });
  
  csvContent += "\n";
  csvContent += "Overall Metric,Value\n";
  csvContent += `Overall Attendance Pct,${overallStats.overallAttendancePct}%\n`;
  csvContent += `Present count,${overallStats.present}\n`;
  csvContent += `Absent count,${overallStats.absent}\n`;
  csvContent += `Total Hours Attended,${overallStats.totalHoursAttended}\n`;
  csvContent += `Total Hours Missed,${overallStats.totalHoursMissed}\n`;
  csvContent += `Current Streak,${overallStats.currentStreak}\n`;
  csvContent += `Longest Streak,${overallStats.longestStreak}\n`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `sempilot_academic_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Trigger JSON export of analytics
 */
export const exportToJSON = (subjectStats = [], overallStats = {}, insights = []) => {
  const payload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      app: "SemPilot Academic Tracker"
    },
    overallStats,
    subjectStats: subjectStats.map(s => ({
      name: s.name,
      credits: s.credits,
      present: s.present,
      absent: s.absent,
      cancelled: s.cancelled,
      attendancePct: s.attendancePct,
      remainingLectures: s.remainingLectures,
      remainingHours: s.remainingHours,
      riskLevel: s.riskLevel,
      riskScore: s.riskScore,
      projectedFinalAttendance: s.projectedFinalAttendance
    })),
    insights
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `sempilot_academic_report_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
