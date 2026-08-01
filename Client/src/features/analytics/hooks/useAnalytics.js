import { useMemo } from "react";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";
import { projectSemesterLectures, mergeLogsAndProjections } from "../utils/projectionUtils.js";
import { calculateOverallAnalytics, calculateSubjectAnalytics } from "../services/analyticsService.js";
import * as riskEngine from "../services/riskEngine.js";
import * as predictionEngine from "../services/predictionEngine.js";
import { generateInsights } from "../services/insightEngine.js";
import { calculateTimeAnalytics } from "../services/timeAnalytics.js";
import { evaluateAchievements } from "../services/achievementEngine.js";
import { generateWeeklyReports, generateMonthlyReports } from "../services/reportGenerator.js";

/**
 * Custom React Hook that coordinates all attendance and academic analytics.
 * Returns heavily memoized analytics datasets.
 */
export function useAnalytics() {
  const { setupData, attendanceLogs, loading, error } = useAcademicData();

  // 1. Project all scheduled lectures for the entire semester
  const projectedLectures = useMemo(() => {
    if (!setupData) return [];
    return projectSemesterLectures(
      setupData.semesterInfo,
      setupData.timetableEntries || [],
      setupData.holidays || []
    );
  }, [setupData]);

  // 2. Merge timetable projections with user-entered logs
  const mergedLectures = useMemo(() => {
    return mergeLogsAndProjections(projectedLectures, attendanceLogs || []);
  }, [projectedLectures, attendanceLogs]);

  // 3. Compute overall analytics
  const overallStats = useMemo(() => {
    if (!setupData) return null;
    const req = setupData.semesterInfo?.attendanceRequirement || 75;
    return calculateOverallAnalytics(mergedLectures, req);
  }, [mergedLectures, setupData]);

  // 4. Compute subject-specific analytics
  const subjectStats = useMemo(() => {
    if (!setupData) return [];
    const req = setupData.semesterInfo?.attendanceRequirement || 75;
    return calculateSubjectAnalytics(
      mergedLectures,
      setupData.subjects || [],
      req,
      riskEngine,
      predictionEngine
    );
  }, [mergedLectures, setupData]);

  // 5. Compute time breakdowns (weekday, hour slots)
  const timeStats = useMemo(() => {
    return calculateTimeAnalytics(mergedLectures);
  }, [mergedLectures]);

  // 6. Generate text insights
  const insights = useMemo(() => {
    if (!overallStats) return [];
    return generateInsights(mergedLectures, subjectStats, overallStats);
  }, [mergedLectures, subjectStats, overallStats]);

  // 7. Evaluate badge achievements
  const achievements = useMemo(() => {
    if (!overallStats) return [];
    return evaluateAchievements(mergedLectures, overallStats.overallAttendancePct);
  }, [mergedLectures, overallStats]);

  // 8. Generate reports
  const weeklyReports = useMemo(() => {
    return generateWeeklyReports(mergedLectures);
  }, [mergedLectures]);

  const monthlyReports = useMemo(() => {
    return generateMonthlyReports(mergedLectures);
  }, [mergedLectures]);

  return {
    loading,
    error,
    hasData: !!setupData,
    mergedLectures,
    overallStats,
    subjectStats,
    timeStats,
    insights,
    achievements,
    weeklyReports,
    monthlyReports
  };
}
