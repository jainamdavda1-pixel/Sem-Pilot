import React from "react";
import { cn } from "../utils/utils";

export const Progress = React.forwardRef(
  ({ className, value = 0, variant = "default", ...props }, ref) => {
    const safeValue = Math.min(Math.max(0, value), 100);

    const barColors = {
      default: "bg-primary",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      danger: "bg-red-500",
    };

    return (
      <div
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
        {...props}
      >
        <div
          className={cn("h-full w-full flex-1 transition-all duration-300 ease-in-out", barColors[variant])}
          style={{ transform: `translateX(-${100 - safeValue}%)` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";
