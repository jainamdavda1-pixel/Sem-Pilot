import React from "react";
import { Check, X, Clock, MapPin, AlertCircle, Award } from "lucide-react";
import { Card, CardContent } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { cn } from "../../../shared/utils/utils";

export function TodaySchedule({ 
  todayEntries = [], 
  todayLogs = [], // Logs for today: [{ subjectName, startTime, status }]
  subjectStats = [], // Overall stats for subjects: [{ name, percentage }]
  target = 75,
  onLogAttendance 
}) {

  // Helper to find log status for a specific entry today
  const getLogStatus = (entry) => {
    const match = todayLogs.find(
      (l) => l.subjectName?.toLowerCase() === entry.subjectName?.toLowerCase() && 
             l.startTime === entry.startTime
    );
    return match ? match.status : null; // "Present" | "Absent" | null
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between select-none">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Today's Schedule Lectures
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold uppercase">
          {todayEntries.length} classes scheduled
        </span>
      </div>

      {todayEntries.length === 0 ? (
        <Card className="border border-dashed border-slate-200 bg-white">
          <CardContent className="p-8 text-center select-none text-slate-400 text-xs">
            No classes scheduled for today. Take a break!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayEntries.map((entry, idx) => {
            const status = getLogStatus(entry);
            const subStat = subjectStats.find(
              (s) => s.name?.toLowerCase() === entry.subjectName?.toLowerCase()
            );
            const currentPercent = subStat ? subStat.percentage : 0;
            const hasStats = !!subStat && subStat.total > 0;

            return (
              <Card
                key={idx}
                className={cn(
                  "border hover:border-slate-300 transition-all select-none duration-150 overflow-hidden relative",
                  status === "Present" && "border-emerald-200/80 bg-emerald-50/[0.01]",
                  status === "Absent" && "border-red-200/80 bg-red-50/[0.01]"
                )}
              >
                {/* Visual state accent bar on the left */}
                {status === "Present" && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                )}
                {status === "Absent" && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                )}

                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  {/* Subject details & badges */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                        {entry.code || "Course Code"}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-800 tracking-tight leading-snug">
                        {entry.subjectName}
                      </h4>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 uppercase font-bold tracking-wider">
                        {entry.lectureType}
                      </Badge>
                    </div>
                  </div>

                  {/* Timings, Instructors & Current percentage */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 border-t border-b border-slate-50 py-2.5">
                    <div className="space-y-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {entry.startTime} - {entry.endTime}
                      </span>
                      {entry.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {entry.room}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {hasStats ? (
                        <div className="space-y-0.5">
                          <span className={cn(
                            "text-xs font-bold block",
                            currentPercent >= target ? "text-emerald-600" : "text-amber-600"
                          )}>
                            {currentPercent}%
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium block">
                            Attendance Ratio
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase tracking-wider">
                          New Subject
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Present/Absent Toggles */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onLogAttendance(entry, "Present")}
                      className={cn(
                        "h-9 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer",
                        status === "Present"
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      )}
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      Present
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => onLogAttendance(entry, "Absent")}
                      className={cn(
                        "h-9 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer",
                        status === "Absent"
                          ? "bg-red-600 border-red-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      )}
                    >
                      <X className="w-4 h-4 shrink-0" />
                      Absent
                    </button>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default TodaySchedule;
