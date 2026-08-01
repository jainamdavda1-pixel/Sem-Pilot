import React from "react";
import { Check, X, CalendarCheck2 } from "lucide-react";
import { Card, CardContent } from "../../../shared/components/Card";
import { Progress } from "../../../shared/components/Progress";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { cn } from "../../../shared/utils/utils";

export function AttendanceCard({
  className,
  courseCode,
  courseName,
  attended = 0,
  total = 0,
  target = 75,
  history = [],
  statusText,
  statusType = "default",
}) {
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
  
  // Decide which progress bar variant to show based on status type
  const getProgressVariant = (type) => {
    if (type === "success") return "success";
    if (type === "warning") return "warning";
    if (type === "danger") return "danger";
    return "default";
  };

  return (
    <Card className={cn("hover:border-slate-300 transition-colors duration-150", className)}>
      <CardContent className="p-6">
        {/* Header Block */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              {courseCode}
            </span>
            <h3 className="text-base font-semibold text-slate-800 tracking-tight leading-snug">
              {courseName}
            </h3>
          </div>
          {statusText && (
            <Badge variant={statusType} className="text-[10px] font-semibold">
              {statusText}
            </Badge>
          )}
        </div>

        {/* Stats Row */}
        <div className="mt-5 flex items-baseline justify-between text-sm">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{percentage}%</span>
            <span className="text-xs text-slate-400 font-medium select-none">
              current
            </span>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {attended} / {total} lectures
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5">
          <Progress value={percentage} variant={getProgressVariant(statusType)} />
          <div className="flex justify-between items-center mt-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>0%</span>
            <span>Target {target}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Ticks Grid (Recent History) */}
        {history.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider select-none mr-1">
                Recent:
              </span>
              <div className="flex gap-1">
                {history.map((present, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all duration-150 select-none",
                      present
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200/50"
                        : "bg-red-50 text-red-600 border-red-200/50"
                    )}
                    title={present ? "Present" : "Absent"}
                  >
                    {present ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <X className="w-2.5 h-2.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Button Mock */}
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-slate-900 border border-slate-100 hover:bg-slate-50">
              <CalendarCheck2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Log class
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
