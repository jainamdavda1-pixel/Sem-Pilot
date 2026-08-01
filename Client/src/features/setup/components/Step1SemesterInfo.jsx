import React from "react";
import { useFormContext } from "react-hook-form";
import { AlertCircle } from "lucide-react";

export function Step1SemesterInfo() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();

  const attendanceVal = watch("semesterInfo.attendanceRequirement") ?? 75;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Semester Profile</h3>
        <p className="text-xs text-slate-500">Provide the foundational details for your academic term.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {/* Semester Name */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="semester">
            Semester Name
          </label>
          <input
            id="semester"
            type="text"
            placeholder="e.g. Fall Semester, Semester 5"
            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            {...register("semesterInfo.semester")}
          />
          {errors.semesterInfo?.semester && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              {errors.semesterInfo.semester.message}
            </p>
          )}
        </div>

        {/* Academic Year */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="academicYear">
            Academic Year
          </label>
          <input
            id="academicYear"
            type="text"
            placeholder="e.g. 2026-2027"
            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            {...register("semesterInfo.academicYear")}
          />
          {errors.semesterInfo?.academicYear && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              {errors.semesterInfo.academicYear.message}
            </p>
          )}
        </div>

        {/* Semester Start Date */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="semesterStartDate">
            Semester Start Date
          </label>
          <input
            id="semesterStartDate"
            type="date"
            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            {...register("semesterInfo.semesterStartDate")}
          />
          {errors.semesterInfo?.semesterStartDate && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              {errors.semesterInfo.semesterStartDate.message}
            </p>
          )}
        </div>

        {/* Semester End Date */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="semesterEndDate">
            Semester End Date
          </label>
          <input
            id="semesterEndDate"
            type="date"
            className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            {...register("semesterInfo.semesterEndDate")}
          />
          {errors.semesterInfo?.semesterEndDate && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              {errors.semesterInfo.semesterEndDate.message}
            </p>
          )}
        </div>

        {/* Minimum Attendance Requirement */}
        <div className="space-y-1.5 sm:col-span-2 text-left">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Min. Attendance Requirement: <span className="text-primary font-bold">{attendanceVal}%</span>
          </label>
          <div className="flex items-center gap-4 h-9">
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              className="flex-1 accent-primary cursor-pointer font-sans"
              {...register("semesterInfo.attendanceRequirement", { valueAsNumber: true })}
            />
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200 shrink-0 select-none">
              {attendanceVal}%
            </span>
          </div>
          {errors.semesterInfo?.attendanceRequirement && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              {errors.semesterInfo.attendanceRequirement.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
export default Step1SemesterInfo;
