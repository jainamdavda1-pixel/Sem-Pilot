import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Star, AlertCircle, Bookmark, ShieldAlert, Award } from "lucide-react";
import { Badge } from "../../../shared/components/Badge";
import { cn } from "../../../shared/utils/utils";

export function Step3ReviewSubjects() {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const { fields } = useFieldArray({
    control,
    name: "subjects",
  });

  const subjectsWatch = watch("subjects") || [];

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-left">
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Review Generated Subjects</h3>
        <p className="text-xs text-slate-500">
          We detected {fields.length} unique courses from your timetable. Define instructor ratings and subject priorities.
        </p>
      </div>

      {fields.length === 0 ? (
        <div className="p-8 border border-dashed border-red-200 bg-red-50/20 text-center rounded-lg space-y-3 max-w-xl mx-auto">
          <ShieldAlert className="w-8 h-8 text-red-500 mx-auto shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-red-800">No Subjects Detected</h4>
            <p className="text-xs text-red-600/80 leading-relaxed max-w-sm mx-auto">
              Your weekly timetable is empty. Please click "Back" and schedule at least one lecture so we can construct your Subject Master list.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl text-left">
          {fields.map((field, index) => {
            const subjectName = watch(`subjects.${index}.name`) || "";
            const ratingVal = watch(`subjects.${index}.facultyRating`) || 3;
            const priorityVal = watch(`subjects.${index}.priority`) || "medium";
            const strictnessVal = watch(`subjects.${index}.facultyStrictness`) || "medium";

            return (
              <div
                key={field.id}
                className="p-5 border border-slate-200 bg-white rounded-lg shadow-sm hover:border-slate-300 transition-all"
              >
                {/* Subject Name header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 mb-4 select-none">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-slate-800">
                      {subjectName}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                    Subject Master {index + 1}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">
                      Faculty Rating
                    </label>
                    <div className="flex items-center gap-1.5 h-9 select-none">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setValue(`subjects.${index}.facultyRating`, star)}
                          className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Star
                            className={cn(
                              "w-5 h-5",
                              star <= ratingVal
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 hover:text-amber-300"
                            )}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-slate-400 font-semibold ml-1">({ratingVal}/5)</span>
                    </div>
                  </div>

                  {/* Strictness Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none" htmlFor={`strictness-${index}`}>
                      Faculty Strictness
                    </label>
                    <select
                      id={`strictness-${index}`}
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={strictnessVal}
                      onChange={(e) => setValue(`subjects.${index}.facultyStrictness`, e.target.value)}
                    >
                      <option value="low">Low (Easy Going)</option>
                      <option value="medium">Medium (Standard)</option>
                      <option value="high">High (Strict Attendance)</option>
                    </select>
                  </div>

                  {/* Priority Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none" htmlFor={`priority-${index}`}>
                      Subject Priority
                    </label>
                    <select
                      id={`priority-${index}`}
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={priorityVal}
                      onChange={(e) => setValue(`subjects.${index}.priority`, e.target.value)}
                    >
                      <option value="very_high">Very High</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default Step3ReviewSubjects;
