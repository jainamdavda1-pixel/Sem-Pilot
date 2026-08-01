import React from "react";
import { Badge } from "./Badge";
import { cn } from "../utils/utils";

export function TimelineCard({ className, time, title, subtitle, status, statusType = "default", icon: Icon }) {
  return (
    <div className={cn(
      "flex gap-4 p-4 border border-border/80 bg-white rounded-lg shadow-sm hover:border-slate-300 transition-colors duration-150 relative overflow-hidden",
      status === "Cancelled" && "opacity-60",
      className
    )}>
      {/* Left indicator accent strip if state is active */}
      {status === "Next up" && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      )}

      {/* Time column */}
      <div className="flex flex-col justify-center min-w-[100px] border-r border-slate-100 pr-4">
        <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
          {time}
        </span>
        <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
          Schedule
        </span>
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 truncate leading-snug">
              {title}
            </h4>
            {subtitle && (
              <p className="text-xs text-slate-500 font-normal leading-normal mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {status && (
            <Badge variant={statusType} className="shrink-0 text-[10px] py-0 px-2">
              {status}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
