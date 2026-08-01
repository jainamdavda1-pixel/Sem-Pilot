import React from "react";
import { CalendarRange, GraduationCap, Award, BookOpen } from "lucide-react";
import { Progress } from "../../../shared/components/Progress";

export function WelcomeBanner({ greeting, name = "Student", stats = {}, dates = {} }) {
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Calculate semester progress based on semester start/end dates
  const getSemesterProgress = () => {
    const startStr = dates.semesterStartDate || dates.midsemStart;
    const endStr = dates.semesterEndDate || dates.endsemEnd;

    if (!startStr || !endStr) {
      return { percentage: 35, label: "Progress Estimation" };
    }
    const start = new Date(startStr);
    const end = new Date(endStr);
    const now = new Date();
    
    if (now > end) return { percentage: 100, label: "Semester Completed" };
    if (now < start) return { percentage: 0, label: "Semester Not Started" };

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const percentage = Math.round((elapsed / totalDuration) * 100);

    // Days remaining till endsem
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      percentage: Math.min(Math.max(0, percentage), 100),
      label: `${diffDays} days remaining in semester`,
    };
  };

  const progress = getSemesterProgress();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-white border border-slate-200/80 rounded-xl shadow-sm select-none text-left">
      <div className="space-y-1.5 flex-1 min-w-0">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          {todayStr}
        </span>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          {greeting}, {name}
        </h2>
        <p className="text-xs text-slate-500 leading-normal max-w-md">
          {stats.todayCount > 0 
            ? `You have ${stats.todayCount} lectures scheduled today. Log your attendance in a single click.` 
            : "No classes scheduled for today. Take a break!"}
        </p>
      </div>

      {/* Semester progress bar widget */}
      <div className="w-full md:w-64 space-y-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
        <div className="flex justify-between items-baseline text-xs font-semibold text-slate-500">
          <span>Semester Timeline</span>
          <span>{progress.percentage}%</span>
        </div>
        <Progress value={progress.percentage} variant="default" className="h-1.5" />
        <span className="text-[10px] text-slate-400 font-medium block">
          {progress.label}
        </span>
      </div>
    </div>
  );
}
export default WelcomeBanner;
