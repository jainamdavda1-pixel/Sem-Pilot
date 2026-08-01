import React from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";

export default function ValidationCard({ errors, warnings }) {
  if ((!errors || errors.length === 0) && (!warnings || warnings.length === 0)) return null;

  return (
    <div className="border border-slate-200/60 rounded-xl overflow-hidden shadow-xs bg-white text-left font-sans">
      <div className="bg-slate-50/50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
        <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Validation & Integration Report
        </span>
      </div>

      <div className="p-4 space-y-3">
        {errors && errors.map((err, idx) => (
          <div 
            key={`err-${idx}`} 
            className="flex items-start gap-2.5 p-3 rounded-lg border border-red-100 bg-red-50 text-red-600 text-xs leading-normal font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{err}</span>
          </div>
        ))}

        {warnings && warnings.map((warn, idx) => (
          <div 
            key={`warn-${idx}`} 
            className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-100 bg-amber-50 text-amber-600 text-xs leading-normal font-medium"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <span>{warn}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
