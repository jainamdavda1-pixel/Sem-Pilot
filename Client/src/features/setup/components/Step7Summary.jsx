import React from "react";
import { useFormContext } from "react-hook-form";
import {
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  Award,
  CalendarDays
} from "lucide-react";
import { Badge } from "../../../shared/components/Badge";

export function Step7Summary() {
  const { watch } = useFormContext();

  // Watch form states
  const semesterInfo = watch("semesterInfo") || {};
  const subjects = watch("subjects") || [];
  const timetableEntries = watch("timetableEntries") || [];
  const dates = watch("dates") || {};
  const preferences = watch("preferences") || {};

  // Formatter for calendar date strings
  const formatDate = (dateStr) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStrategyLabel = (val) => {
    switch (val) {
      case "always_maintain":
        return "Always Maintain";
      case "build_buffer":
        return "Build Buffer";
      case "save_bunks":
        return "Save for Exams";
      case "balanced":
        return "Balanced Approach";
      default:
        return "Balanced";
    }
  };

  return (
    <div className="space-y-6 text-left max-w-3xl">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Review Semester Profile</h3>
        <p className="text-xs text-slate-500">Ensure the configurations are correct before final setup initialization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Semester Profile Summary */}
        <div className="p-5 border border-slate-200 bg-white rounded-lg shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary shrink-0" />
            Semester Profile
          </h4>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="font-medium text-slate-400">College</span>
              <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">{semesterInfo.collegeName || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-400">Degree</span>
              <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{semesterInfo.degree || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-400">Semester / Year</span>
              <span className="font-semibold text-slate-800">{semesterInfo.semester || "Not set"} ({semesterInfo.academicYear || "Not set"})</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-400">Semester Term</span>
              <span className="font-semibold text-slate-800 text-right">
                {semesterInfo.semesterStartDate ? `${formatDate(semesterInfo.semesterStartDate)} - ${formatDate(semesterInfo.semesterEndDate)}` : "Not set"}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-50">
              <span className="font-medium text-slate-400">Attendance Target</span>
              <span className="font-bold text-primary">{semesterInfo.attendanceRequirement || 75}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-400">Past Logs Backfilled</span>
              <span className="font-semibold text-slate-800">
                {watch("hasSemesterStarted") === "Yes"
                  ? `Yes (${(watch("pastLectures") || []).filter(l => l.status !== null).length} sessions)`
                  : "No (Fresh Start)"}
              </span>
            </div>
          </div>
        </div>

        {/* Calendar and Deadlines Summary */}
        <div className="p-5 border border-slate-200 bg-white rounded-lg shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            Key Exam Dates
          </h4>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="font-medium text-slate-400">Midsem Window</span>
              <span className="font-semibold text-slate-800 text-right">
                {dates.midsemStart ? `${formatDate(dates.midsemStart)} - ${formatDate(dates.midsemEnd)}` : "Not scheduled"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-400">Endsem Window</span>
              <span className="font-semibold text-slate-800 text-right">
                {dates.endsemStart ? `${formatDate(dates.endsemStart)} - ${formatDate(dates.endsemEnd)}` : "Not scheduled"}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-50">
              <span className="font-medium text-slate-400">Custom Holidays</span>
              <span className="font-semibold text-slate-800">{dates.holidays?.length || 0} dates added</span>
            </div>
          </div>
        </div>

        {/* Subjects list summary */}
        <div className="p-5 border border-slate-200 bg-white rounded-lg shadow-sm space-y-4 md:col-span-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary shrink-0" />
            Subjects & Weekly Classes
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {subjects.map((sub, idx) => {
                // Find all instructors from timetable entries for this subject
                const instructors = [
                  ...new Set(
                    timetableEntries
                      .filter((e) => e.subjectName?.toLowerCase() === sub.name?.toLowerCase())
                      .map((e) => e.facultyName)
                      .filter(Boolean)
                  ),
                ];
                const instructorText = instructors.length > 0 ? instructors.join(", ") : "Not set";

                return (
                  <div key={idx} className="p-3 border border-slate-200/60 rounded-md bg-slate-50/40 text-xs flex flex-col justify-between space-y-1.5 shadow-[0_1px_1px_rgba(0,0,0,0.01)]">
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-semibold text-slate-800 truncate" title={sub.name}>
                        {sub.name}
                      </span>
                      <Badge variant="secondary" className="text-[9px] uppercase tracking-wider scale-95 origin-right shrink-0">
                        {sub.priority.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">Instructor: {instructorText}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100/50">
                      <span>Rating: {sub.facultyRating} ★</span>
                      <span className="capitalize">{sub.facultyStrictness} strict</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Total Courses:</span>
                <span className="font-bold text-slate-800">{subjects.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Lectures Configured:</span>
                <span className="font-bold text-slate-800">{timetableEntries.length} classes per week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy preferences summary */}
        <div className="p-5 border border-slate-200 bg-white rounded-lg shadow-sm space-y-4 md:col-span-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary shrink-0" />
            Attendance Strategy & Preferences
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Morning Affinity</span>
                <span className="font-semibold text-slate-800 uppercase text-[10px]">{preferences.prefMorning || "Neutral"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Evening Affinity</span>
                <span className="font-semibold text-slate-800 uppercase text-[10px]">{preferences.prefEvening || "Neutral"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Labs Affinity</span>
                <span className="font-semibold text-slate-800 uppercase text-[10px]">{preferences.prefLabs || "Neutral"}</span>
              </div>
            </div>

            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Max. Continuous Classes</span>
                <span className="font-semibold text-slate-800">{preferences.prefMaxContinuous || "3"} lectures</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Attendance Strategy</span>
                <span className="font-bold text-primary">{getStrategyLabel(preferences.prefStrategy)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Goal Threshold</span>
                <span className="font-bold text-primary">{preferences.prefAttendanceGoal || "75%"}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
export default Step7Summary;
