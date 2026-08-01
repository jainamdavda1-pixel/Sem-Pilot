import React from "react";
import { useFormContext } from "react-hook-form";
import { Coffee, Moon, Milestone, Target, Compass, Award } from "lucide-react";
import { cn } from "../../../shared/utils/utils";

export function Step6Preferences() {
  const { setValue, watch } = useFormContext();

  // Watch preference states
  const prefMorning = watch("preferences.prefMorning") || "neutral";
  const prefEvening = watch("preferences.prefEvening") || "neutral";
  const prefLabs = watch("preferences.prefLabs") || "neutral";
  const prefMaxContinuous = watch("preferences.prefMaxContinuous") || "3";
  const prefAttendanceGoal = watch("preferences.prefAttendanceGoal") || "75%";
  const prefStrategy = watch("preferences.prefStrategy") || "balanced";

  const renderOpinionButtons = (fieldName, currentValue) => {
    const choices = [
      { value: "love", label: "Love" },
      { value: "neutral", label: "Neutral" },
      { value: "dislike", label: "Dislike" },
    ];

    return (
      <div className="flex border border-slate-200 rounded-md p-0.5 bg-slate-50 w-full select-none">
        {choices.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setValue(fieldName, c.value)}
            className={cn(
              "flex-1 h-7 text-xs font-semibold rounded transition-all cursor-pointer",
              currentValue === c.value
                ? "bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    );
  };

  const strategies = [
    {
      value: "always_maintain",
      label: "Always Maintain",
      description: "Consistent attendance, minimum skipping.",
    },
    {
      value: "build_buffer",
      label: "Build Buffer",
      description: "Attend early lectures to save bunk days for later.",
    },
    {
      value: "save_bunks",
      label: "Save for Exams",
      description: "Maximize bunk days during prep/midsem seasons.",
    },
    {
      value: "balanced",
      label: "Balanced Approach",
      description: "Adaptive tracking based on subject health.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Onboarding Preferences</h3>
        <p className="text-xs text-slate-500">Fine-tune the recommendation engine according to your study style.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl text-left">
        
        {/* Timing and Labs preferences block */}
        <div className="space-y-4 p-5 border border-slate-200 bg-white rounded-lg shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Coffee className="w-4 h-4 text-primary shrink-0" />
            Class Affinities
          </h4>
          
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 block">Morning Lectures</span>
                <span className="text-[10px] text-slate-400">Class slots before 10:30 AM</span>
              </div>
              <div className="w-44 shrink-0">
                {renderOpinionButtons("preferences.prefMorning", prefMorning)}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 block">Evening Lectures</span>
                <span className="text-[10px] text-slate-400">Class slots after 3:30 PM</span>
              </div>
              <div className="w-44 shrink-0">
                {renderOpinionButtons("preferences.prefEvening", prefEvening)}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 block">Practical Labs</span>
                <span className="text-[10px] text-slate-400">Long practical blocks</span>
              </div>
              <div className="w-44 shrink-0">
                {renderOpinionButtons("preferences.prefLabs", prefLabs)}
              </div>
            </div>
          </div>
        </div>

        {/* Focus and Goals settings block */}
        <div className="space-y-4 p-5 border border-slate-200 bg-white rounded-lg shadow-sm flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary shrink-0" />
            Targets & Capacity
          </h4>

          <div className="space-y-4 flex-1 mt-2">
            {/* Max continuous lectures */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-800">Max continuous classes before fatigue</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Classes</span>
              </div>
              <div className="flex border border-slate-200 rounded-md p-0.5 bg-slate-50 select-none">
                {["2", "3", "4", "5+"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setValue("preferences.prefMaxContinuous", val)}
                    className={cn(
                      "flex-1 h-7 text-xs font-semibold rounded transition-all cursor-pointer",
                      prefMaxContinuous === val
                        ? "bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred goal */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-800">Desired safety threshold goal</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Percentage</span>
              </div>
              <div className="flex border border-slate-200 rounded-md p-0.5 bg-slate-50 select-none">
                {["75%", "80%", "85%", "90%"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setValue("preferences.prefAttendanceGoal", val)}
                    className={cn(
                      "flex-1 h-7 text-xs font-semibold rounded transition-all cursor-pointer",
                      prefAttendanceGoal === val
                        ? "bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Strategy Section */}
      <div className="space-y-3 pt-2 text-left max-w-3xl">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary shrink-0" />
          Attendance Strategy
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {strategies.map((strat) => (
            <div
              key={strat.value}
              onClick={() => setValue("preferences.prefStrategy", strat.value)}
              className={cn(
                "p-4 border rounded-lg cursor-pointer transition-all flex flex-col justify-center",
                prefStrategy === strat.value
                  ? "border-primary bg-blue-50/10 shadow-[0_1px_2px_rgba(59,130,246,0.02)]"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              )}
            >
              <span className="text-xs font-semibold text-slate-800 block">
                {strat.label}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 leading-normal">
                {strat.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default Step6Preferences;
