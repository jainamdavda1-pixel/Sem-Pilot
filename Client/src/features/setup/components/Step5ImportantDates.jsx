import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, CalendarDays, AlertCircle } from "lucide-react";
import { Button } from "../../../shared/components/Button";

export function Step5ImportantDates() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "dates.holidays",
  });

  const handleAddHoliday = () => {
    append({ date: "", name: "" });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Key Semester Dates</h3>
        <p className="text-xs text-slate-500">Log your scheduled exam weeks and holidays to calculate buffer periods.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {/* Midsem Period */}
        <div className="p-4 border border-slate-200/60 bg-white rounded-lg space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mid-Semester Exams</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="midsemStart">
                Start Date
              </label>
              <input
                id="midsemStart"
                type="date"
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary"
                {...register("dates.midsemStart")}
              />
              {errors.dates?.midsemStart && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                  {errors.dates.midsemStart.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="midsemEnd">
                End Date
              </label>
              <input
                id="midsemEnd"
                type="date"
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary"
                {...register("dates.midsemEnd")}
              />
              {errors.dates?.midsemEnd && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                  {errors.dates.midsemEnd.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Endsem Period */}
        <div className="p-4 border border-slate-200/60 bg-white rounded-lg space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">End-Semester Exams</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="endsemStart">
                Start Date
              </label>
              <input
                id="endsemStart"
                type="date"
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary"
                {...register("dates.endsemStart")}
              />
              {errors.dates?.endsemStart && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                  {errors.dates.endsemStart.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="endsemEnd">
                End Date
              </label>
              <input
                id="endsemEnd"
                type="date"
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary"
                {...register("dates.endsemEnd")}
              />
              {errors.dates?.endsemEnd && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                  {errors.dates.endsemEnd.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Holidays List */}
      <div className="space-y-4 pt-4 border-t border-slate-100 max-w-2xl text-left">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-slate-800">Manually Add Holidays</h4>
            <p className="text-xs text-slate-500">Insert custom break days like institutional holidays or festivals.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-dashed hover:border-slate-300"
            onClick={handleAddHoliday}
          >
            <Plus className="w-4 h-4 mr-1 text-slate-400" />
            Add Holiday
          </Button>
        </div>

        {fields.length > 0 ? (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded border border-slate-200/50">
                <input
                  type="date"
                  className="w-40 h-8 px-2 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary"
                  {...register(`dates.holidays.${index}.date`)}
                />
                <input
                  type="text"
                  placeholder="e.g. Diwali Break, Spring Fest"
                  className="flex-1 h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1"
                  {...register(`dates.holidays.${index}.name`)}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 border border-dashed border-slate-200 rounded-lg text-center select-none">
            <p className="text-xs text-slate-400">No custom holidays added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
export default Step5ImportantDates;
