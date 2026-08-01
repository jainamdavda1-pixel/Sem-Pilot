import React from "react";
import { GraduationCap, AlertTriangle, CheckSquare, Clock, Compass, Target } from "lucide-react";
import { Card, CardContent } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { cn } from "../../../shared/utils/utils";

export function SummaryStats({ stats = {}, target = 75, upcomingEntry = null }) {
  const targetPercent = parseFloat(String(target).replace("%", ""));

  const cardList = [
    {
      title: "Overall Attendance",
      value: `${stats.overallPercentage}%`,
      description: `Requirement: ${targetPercent}%`,
      icon: GraduationCap,
      color: stats.overallPercentage >= targetPercent ? "text-emerald-600 bg-emerald-50/50" : "text-amber-600 bg-amber-50/50",
    },
    {
      title: "Attendance Bank Status",
      value: stats.overallTotal === 0 ? "No Logs" : stats.marginValue,
      description: stats.marginText || "No logs recorded",
      icon: Compass,
      color: 
        stats.marginType === "success" 
          ? "text-emerald-600 bg-emerald-50/50" 
          : stats.marginType === "warning" 
            ? "text-amber-600 bg-amber-50/50" 
            : "text-red-600 bg-red-50/50",
      isBadge: true,
      badgeVariant: stats.marginType,
    },
    {
      title: "Below Requirement",
      value: stats.subjectsBelowTarget?.length || 0,
      description: "Subjects below limit",
      icon: AlertTriangle,
      color: (stats.subjectsBelowTarget?.length || 0) > 0 ? "text-red-600 bg-red-50/50" : "text-slate-400 bg-slate-50",
    },
    {
      title: "Updated Today",
      value: `${stats.todayLoggedCount || 0} / ${stats.todayCount || 0}`,
      description: "Lectures checked today",
      icon: CheckSquare,
      color: "text-blue-600 bg-blue-50/50",
    },
  ];

  return (
    <div className="space-y-4 text-left">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
        Performance Overview
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cardList.map((card, idx) => (
          <Card key={idx} className="border border-slate-200/60 bg-white shadow-sm overflow-hidden select-none hover:border-slate-300 transition-colors">
            <CardContent className="p-4.5 flex flex-col justify-between h-full min-h-[110px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={cn("w-7.5 h-7.5 rounded-md flex items-center justify-center shrink-0 border border-slate-100", card.color)}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3.5 space-y-1">
                <span className="text-2xl font-bold tracking-tight text-slate-800">
                  {card.value}
                </span>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Lecture Widget Card */}
      {upcomingEntry && (
        <Card className="border border-blue-100 bg-blue-50/10 shadow-[0_1px_2px_rgba(59,130,246,0.02)] select-none">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Next Upcoming Lecture
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {upcomingEntry.subjectName} ({upcomingEntry.lectureType})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="font-semibold text-slate-700 block">
                  {upcomingEntry.startTime} - {upcomingEntry.endTime}
                </span>
                {upcomingEntry.room && (
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Room: {upcomingEntry.room}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
export default SummaryStats;
