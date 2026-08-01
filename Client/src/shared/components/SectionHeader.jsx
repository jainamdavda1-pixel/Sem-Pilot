import React from "react";
import { cn } from "../utils/utils";

export function SectionHeader({ className, title, description, children }) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/50 mb-6", className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-500 font-normal leading-normal max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2.5 shrink-0 sm:ml-auto">
          {children}
        </div>
      )}
    </div>
  );
}
