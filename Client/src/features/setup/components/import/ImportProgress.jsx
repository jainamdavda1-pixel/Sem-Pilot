import React from "react";
import { Check } from "lucide-react";

export default function ImportProgress({ currentStep, steps }) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs font-sans">
      <div className="flex justify-between items-center max-w-xl mx-auto">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > idx + 1;
          const isActive = currentStep === idx + 1;

          return (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center space-y-2 relative">
                <div 
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted 
                      ? "bg-primary border-primary text-white shadow-xs" 
                      : isActive 
                        ? "border-primary text-primary bg-primary/5 font-extrabold ring-4 ring-primary/10" 
                        : "border-slate-200 text-slate-400 bg-white"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 shrink-0" /> : idx + 1}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                  isActive ? "text-primary" : "text-slate-400"
                }`}>
                  {step}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div 
                  className={`flex-1 h-0.5 max-w-[80px] mx-2 self-start mt-4 transition-all duration-300 ${
                    isCompleted ? "bg-primary" : "bg-slate-100"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
