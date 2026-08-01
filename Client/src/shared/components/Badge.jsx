import React from "react";
import { cn } from "../utils/utils";

export function Badge({ className, variant = "default", ...props }) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold select-none transition-colors duration-150";

  const variants = {
    default: "bg-blue-50 text-blue-700 border-blue-200/50",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    warning: "bg-amber-50 text-amber-800 border-amber-200/50",
    danger: "bg-red-50 text-red-700 border-red-200/50",
    outline: "bg-white text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  );
}
