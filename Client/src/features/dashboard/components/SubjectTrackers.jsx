import React from "react";
import { BookOpen, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { Card, CardContent } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { Progress } from "../../../shared/components/Progress";
import { cn } from "../../../shared/utils/utils";

export function SubjectTrackers({ subjectStats = [], target = 75 }) {
  const targetPercent = parseFloat(String(target).replace("%", ""));

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between select-none">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Subject Attendance Breakdown
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold uppercase">
          {subjectStats.length} modules registered
        </span>
      </div>

      {subjectStats.length === 0 ? (
        <Card className="border border-dashed border-slate-200 bg-white">
          <CardContent className="p-8 text-center select-none text-slate-400 text-xs">
            No subjects found. Please configure your timetable or onboarding profile.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectStats.map((sub, idx) => {
            const hasConducted = sub.total > 0;
            const isSafe = sub.percentage >= targetPercent;
            
            // Choose color variant for progress bar
            const progressVariant = !hasConducted 
              ? "default" 
              : isSafe 
                ? "success" 
                : sub.percentage >= targetPercent - 5 
                  ? "warning" 
                  : "danger";

            return (
              <Card key={idx} className="border border-slate-200/80 bg-card hover:border-slate-300 transition-colors duration-150">
                <CardContent className="p-5 space-y-4">
                  {/* Subject Title & Margin Tag */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-800 tracking-tight leading-snug">
                        {sub.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 pt-0.5 select-none">
                        <Badge variant="outline" className="text-[8px] uppercase tracking-wider scale-95 origin-left px-1.5 py-0">
                          Priority: {sub.priority.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-[8px] uppercase tracking-wider scale-95 origin-left px-1.5 py-0">
                          {sub.facultyStrictness} strictness
                        </Badge>
                      </div>
                    </div>

                    {hasConducted && (
                      <Badge variant={sub.marginType} className="text-[9px] uppercase tracking-wider shrink-0 select-none">
                        {sub.marginText}
                      </Badge>
                    )}
                  </div>

                  {/* Percentage Display & Progress Bar */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-baseline select-none">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-800 tracking-tight">
                          {hasConducted ? `${sub.percentage}%` : "--"}
                        </span>
                        {hasConducted && (
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            attendance
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {sub.attended} / {sub.total} conducted
                      </span>
                    </div>

                    <Progress value={hasConducted ? sub.percentage : 0} variant={progressVariant} />
                  </div>

                  {/* Splits: Theory & Lab stats columns */}
                  {(sub.theoryTotal > 0 || sub.labTotal > 0) && (
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100/80 pt-3 text-xs select-none">
                      {sub.theoryTotal > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline text-slate-500">
                            <span className="font-semibold text-[9px] uppercase tracking-wider">Theory</span>
                            <span className="font-bold text-slate-700">{sub.theoryPercent}%</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                            <span>Conducted</span>
                            <span>{sub.theoryAttended} / {sub.theoryTotal}</span>
                          </div>
                        </div>
                      )}

                      {sub.labTotal > 0 && (
                        <div className="space-y-1 border-l border-slate-100 pl-4">
                          <div className="flex justify-between items-baseline text-slate-500">
                            <span className="font-semibold text-[9px] uppercase tracking-wider">Labs</span>
                            <span className="font-bold text-slate-700">{sub.labPercent}%</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                            <span>Conducted</span>
                            <span>{sub.labAttended} / {sub.labTotal}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary counts logs for unconducted state */}
                  {!hasConducted && (
                    <div className="text-[10px] text-slate-400 font-medium border-t border-slate-50 pt-3 select-none">
                      No lecture sessions logged for this subject yet.
                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default SubjectTrackers;
