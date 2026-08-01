import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { 
  Calendar, 
  Check, 
  X, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  CheckSquare, 
  CalendarDays,
  Sparkles,
  Award
} from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Progress } from "../../../shared/components/Progress";
import { Badge } from "../../../shared/components/Badge";
import { cn } from "../../../shared/utils/utils";

export function Step3PreviousAttendance() {
  const { watch, setValue, getValues } = useFormContext();

  const semesterStartDate = watch("semesterInfo.semesterStartDate");
  const semesterEndDate = watch("semesterInfo.semesterEndDate");
  const timetableEntries = watch("timetableEntries") || [];
  const hasSemesterStarted = watch("hasSemesterStarted") || "No";
  const pastLectures = watch("pastLectures") || [];

  const [activeDate, setActiveDate] = useState("");
  
  // Generate chronological lectures from start date to today
  useEffect(() => {
    if (hasSemesterStarted === "Yes" && pastLectures.length === 0 && semesterStartDate) {
      const generated = [];
      const start = new Date(semesterStartDate);
      const end = new Date(semesterEndDate || new Date());
      const today = new Date();
      // Cap at today's date
      const limit = today < end ? today : end;

      const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      let d = new Date(start);
      while (d <= limit) {
        const weekday = weekdays[d.getDay()];
        const dayEntries = timetableEntries.filter((e) => e.day === weekday);
        
        if (dayEntries.length > 0) {
          const dateStr = d.toISOString().split("T")[0];
          dayEntries.forEach((entry) => {
            generated.push({
              date: dateStr,
              weekday: weekday,
              subjectName: entry.subjectName,
              lectureType: entry.lectureType,
              startTime: entry.startTime,
              endTime: entry.endTime,
              status: null, // "Present" | "Absent" | "Cancelled" | "Holiday"
            });
          });
        }
        d.setDate(d.getDate() + 1);
      }

      // Sort chronological
      generated.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      setValue("pastLectures", generated);

      if (generated.length > 0) {
        setActiveDate(generated[0].date);
      }
    }
  }, [hasSemesterStarted, semesterStartDate, timetableEntries, setValue]);

  // Set initial active date when pastLectures is generated
  useEffect(() => {
    if (pastLectures.length > 0 && !activeDate) {
      setActiveDate(pastLectures[0].date);
    }
  }, [pastLectures, activeDate]);

  // List of unique dates that contain classes
  const uniqueDates = [...new Set(pastLectures.map((l) => l.date))].sort();
  const currentDateIndex = uniqueDates.indexOf(activeDate);

  // Steppers
  const handlePrevDay = () => {
    if (currentDateIndex > 0) {
      setActiveDate(uniqueDates[currentDateIndex - 1]);
    }
  };

  const handleNextDay = () => {
    if (currentDateIndex < uniqueDates.length - 1) {
      setActiveDate(uniqueDates[currentDateIndex + 1]);
    }
  };

  // Set status for single lecture
  const setLectureStatus = (item, status) => {
    const updated = pastLectures.map((l) => {
      if (l.date === item.date && l.subjectName === item.subjectName && l.startTime === item.startTime) {
        return { ...l, status };
      }
      return l;
    });
    setValue("pastLectures", updated);
  };

  // Bulk set for active navigated date
  const bulkSetStatusForDay = (status) => {
    const updated = pastLectures.map((l) => {
      if (l.date === activeDate) {
        return { ...l, status };
      }
      return l;
    });
    setValue("pastLectures", updated);
  };

  // Progress metrics calculations
  const totalCount = pastLectures.length;
  const importedCount = pastLectures.filter((l) => l.status !== null && l.status !== undefined).length;
  const progressPercent = totalCount > 0 ? Math.round((importedCount / totalCount) * 100) : 0;

  // Percentage calculations: Present / (Present + Absent)
  const presentCount = pastLectures.filter((l) => l.status === "Present").length;
  const absentCount = pastLectures.filter((l) => l.status === "Absent").length;
  const loggedConducted = presentCount + absentCount;
  const livePercentage = loggedConducted > 0 ? Math.round((presentCount / loggedConducted) * 100) : 0;

  // Active date scheduled lectures
  const activeDayLectures = pastLectures.filter((l) => l.date === activeDate);

  const formatNavDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Previous Attendance Import</h3>
        <p className="text-xs text-slate-500">Back-fill your attendance log history if your classes have already commenced.</p>
      </div>

      {/* Ask Question toggle */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3.5 shadow-sm max-w-xl">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Has your semester already started?
        </label>
        <div className="grid grid-cols-2 gap-3 select-none">
          {["No", "Yes"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setValue("hasSemesterStarted", opt);
                if (opt === "No") {
                  setValue("pastLectures", []);
                }
              }}
              className={cn(
                "h-10 rounded-md border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer",
                hasSemesterStarted === opt
                  ? "bg-primary border-primary text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              {opt === "No" ? "No, starting fresh" : "Yes, back-fill history"}
            </button>
          ))}
        </div>
      </div>

      {hasSemesterStarted === "Yes" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Progress dashboard widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Completion stats */}
            <Card className="border border-slate-200/60 bg-white md:col-span-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-baseline select-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Import Status Progress
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    Imported {importedCount} of {totalCount} lectures ({progressPercent}%)
                  </span>
                </div>
                <Progress value={progressPercent} variant="default" className="h-1.5" />
              </CardContent>
            </Card>

            {/* Live calculation stats */}
            <Card className="border border-slate-200/60 bg-white">
              <CardContent className="p-4 flex flex-col justify-between h-full min-h-[70px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Live Attendance Rate
                </span>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-2xl font-bold text-slate-800 tracking-tight">
                    {loggedConducted > 0 ? `${livePercentage}%` : "--"}
                  </span>
                  {loggedConducted > 0 && (
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                      (P: {presentCount} • A: {absentCount})
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Date Navigation Row */}
          {uniqueDates.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-xl shadow-inner select-none">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevDay}
                  disabled={currentDateIndex <= 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </Button>

                {/* Date display & custom date picker shortcut */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={activeDate}
                    onChange={(e) => {
                      if (uniqueDates.includes(e.target.value)) {
                        setActiveDate(e.target.value);
                      }
                    }}
                    min={semesterStartDate}
                    max={semesterEndDate || new Date().toISOString().split("T")[0]}
                    className="bg-transparent border-0 text-slate-800 font-semibold text-xs text-center focus:outline-none cursor-pointer hover:text-primary transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block">
                    ({formatNavDate(activeDate).split(",")[0]})
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleNextDay}
                  disabled={currentDateIndex >= uniqueDates.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </Button>
              </div>

              {/* Bulk operations row */}
              <div className="flex flex-wrap gap-2 py-0.5 select-none">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] font-bold border-emerald-100 text-emerald-600 bg-emerald-50/10 hover:bg-emerald-50"
                  onClick={() => bulkSetStatusForDay("Present")}
                >
                  All Present
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] font-bold border-red-100 text-red-600 bg-red-50/10 hover:bg-red-50"
                  onClick={() => bulkSetStatusForDay("Absent")}
                >
                  All Absent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] font-bold border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100"
                  onClick={() => bulkSetStatusForDay("Holiday")}
                >
                  Mark Holiday
                </Button>
              </div>

              {/* Daily Lectures Checklist List */}
              <div className="space-y-3 max-w-xl">
                {activeDayLectures.map((lec, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 border border-slate-200/80 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-100",
                      lec.status === "Present" && "border-emerald-200 bg-emerald-50/[0.01]",
                      lec.status === "Absent" && "border-red-200 bg-red-50/[0.01]"
                    )}
                  >
                    <div className="space-y-1">
                      <h5 className="text-sm font-semibold text-slate-800 tracking-tight leading-none">
                        {lec.subjectName}
                      </h5>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold leading-none">
                        <span className="uppercase">{lec.lectureType}</span>
                        <span>•</span>
                        <span>{lec.startTime} - {lec.endTime}</span>
                      </div>
                    </div>

                    {/* Radio Button group */}
                    <div className="flex border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0 select-none">
                      {[
                        { label: "Present", value: "Present", color: "bg-emerald-600 text-white" },
                        { label: "Absent", value: "Absent", color: "bg-red-600 text-white" },
                        { label: "Cancelled", value: "Cancelled", color: "bg-amber-600 text-white" },
                        { label: "Holiday", value: "Holiday", color: "bg-slate-600 text-white" },
                      ].map((btn) => (
                        <button
                          key={btn.value}
                          type="button"
                          onClick={() => setLectureStatus(lec, btn.value)}
                          className={cn(
                            "px-2.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-colors",
                            lec.status === btn.value
                              ? btn.color
                              : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-slate-200 bg-white text-slate-400 text-xs rounded-lg text-center select-none">
              No classes detected in this date range. Make sure your timetable is populated correctly.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default Step3PreviousAttendance;
