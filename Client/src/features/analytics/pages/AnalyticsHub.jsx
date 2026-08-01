import React, { useState } from "react";
import { useAnalytics } from "../hooks/useAnalytics.js";
import { AnalyticsOverview } from "../components/AnalyticsOverview.jsx";
import { SubjectComparison } from "../components/SubjectComparison.jsx";
import { AnalyticsCalendar } from "../components/AnalyticsCalendar.jsx";
import { HeatmapView } from "../components/HeatmapView.jsx";
import { AchievementsList } from "../components/AchievementsList.jsx";
import { ReportsView } from "../components/ReportsView.jsx";
import {
  BarChart3,
  Calendar,
  Grid,
  Award,
  FileText,
  Target,
  AlertTriangle,
  ArrowRight,
  Loader2,
  CheckCircle,
  HelpCircle
} from "lucide-react";

export function AnalyticsHub() {
  const {
    loading,
    error,
    hasData,
    mergedLectures,
    overallStats,
    subjectStats,
    timeStats,
    insights,
    achievements,
    weeklyReports,
    monthlyReports
  } = useAnalytics();

  const [activeTab, setActiveTab] = useState("overview");
  const [targetGoal, setTargetGoal] = useState(75); // default 75%

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Computing academic projections...</p>
      </div>
    );
  }

  if (error || !hasData || !overallStats) {
    return (
      <div className="p-12 border border-dashed border-slate-200 bg-white rounded-lg flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto mt-12 shadow-sm font-sans text-slate-800">
        <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-slate-800 tracking-tight">Data Sync Required</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Please make sure you have initialized a semester and logged attendance records to populate the Academic Analytics Hub.
          </p>
        </div>
      </div>
    );
  }

  // Goal math calculations
  const totalActive = overallStats.present + overallStats.absent;
  const currentPct = overallStats.overallAttendancePct;
  const targetFraction = targetGoal / 100;

  let lecturesRequired = 0;
  let isTargetAchieved = currentPct >= targetGoal;
  let remainingBuffer = 0;

  if (totalActive > 0) {
    if (isTargetAchieved) {
      remainingBuffer = Math.max(0, Math.floor((overallStats.present - targetFraction * totalActive) / targetFraction));
    } else {
      lecturesRequired = Math.max(0, Math.ceil((targetFraction * totalActive - overallStats.present) / (1 - targetFraction)));
    }
  }

  // Check if remaining classes are enough to recover
  const totalRemaining = mergedLectures.filter(l => l.status === "Future").length;
  const isRecoverable = isTargetAchieved || lecturesRequired <= totalRemaining;

  const tabs = [
    { id: "overview", label: "Dashboard Overview", icon: BarChart3 },
    { id: "subjects", label: "Subject Breakdown", icon: Target },
    { id: "calendar", label: "Registry Calendar", icon: Calendar },
    { id: "heatmap", label: "Grid Heatmap", icon: Grid },
    { id: "achievements", label: "Badges & Streaks", icon: Award },
    { id: "reports", label: "Reports & Exports", icon: FileText }
  ];

  return (
    <div className="space-y-6 text-left font-sans select-none max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Academic Analytics Hub</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time attendance projection, risk metrics, and strategy forecasts.</p>
      </div>

      {/* Target Goal Widget Card */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
        {/* Goal Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Target Attendance Goal
          </label>
          <div className="flex gap-2">
            {[75, 80, 85, 90].map((g) => (
              <button
                key={g}
                onClick={() => setTargetGoal(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  targetGoal === g
                    ? "bg-primary border-primary text-white"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {g}%
              </button>
            ))}
          </div>
        </div>

        {/* Goal Projection Feedback */}
        <div className="lg:col-span-2 p-4 rounded-xl border flex gap-3 text-xs leading-relaxed justify-between items-center bg-slate-50/50 border-slate-100">
          <div className="flex gap-3 items-start">
            <Target className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">
                {isTargetAchieved ? "Goal Achieved!" : "Below Target Projection"}
              </span>
              <p className="text-slate-500 pr-4">
                {isTargetAchieved ? (
                  <>
                    Your current attendance ({currentPct}%) exceeds the selected target ({targetGoal}%). You can safely skip up to <strong>{remainingBuffer}</strong> consecutive classes without dropping below the target.
                  </>
                ) : (
                  <>
                    You are below the selected target ({targetGoal}%). You must attend the next <strong>{lecturesRequired}</strong> scheduled classes consecutively to recover.
                    {!isRecoverable && (
                      <span className="text-rose-600 block mt-1.5 font-bold">
                        ⚠️ Warning: With only {totalRemaining} classes remaining, it is mathematically impossible to reach this target this semester.
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
          {/* Progress Indicator Circle or Ring */}
          <div className="hidden sm:flex shrink-0 w-16 h-16 bg-white rounded-full border border-slate-100 shadow-inner items-center justify-center font-extrabold text-slate-800">
            {currentPct}%
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <AnalyticsOverview
            overallStats={overallStats}
            subjectStats={subjectStats}
            mergedLectures={mergedLectures}
            insights={insights}
          />
        )}
        {activeTab === "subjects" && (
          <SubjectComparison
            subjectStats={subjectStats}
            attendanceRequirement={targetGoal}
          />
        )}
        {activeTab === "calendar" && (
          <AnalyticsCalendar
            mergedLectures={mergedLectures}
          />
        )}
        {activeTab === "heatmap" && (
          <HeatmapView
            mergedLectures={mergedLectures}
            semesterInfo={analyticsInfoHelper(mergedLectures)}
          />
        )}
        {activeTab === "achievements" && (
          <AchievementsList
            achievements={achievements}
          />
        )}
        {activeTab === "reports" && (
          <ReportsView
            weeklyReports={weeklyReports}
            monthlyReports={monthlyReports}
            subjectStats={subjectStats}
            overallStats={overallStats}
            insights={insights}
          />
        )}
      </div>
    </div>
  );
}

// Small helper to extract dates from merged lectures to construct bounding boxes
function analyticsInfoHelper(mergedLectures) {
  if (mergedLectures.length === 0) return null;
  const sorted = [...mergedLectures].sort((a, b) => a.date.localeCompare(b.date));
  return {
    semesterStartDate: sorted[0].date,
    semesterEndDate: sorted[sorted.length - 1].date
  };
}
