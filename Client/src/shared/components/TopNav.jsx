import React from "react";
import { Search, HelpCircle, CalendarRange } from "lucide-react";
import { cn } from "../utils/utils";

export function TopNav({ className, title = "Dashboard" }) {
  // Get formatting for the current date
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className={cn("h-14 border-b border-slate-200/60 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shrink-0", className)}>
      {/* Page Title & Breadcrumbs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium tracking-wide uppercase select-none">SemPilot</span>
        <span className="text-slate-300">/</span>
        <h1 className="text-sm font-semibold text-slate-800 tracking-tight">{title}</h1>
      </div>

      {/* Right Side Options */}
      <div className="flex items-center gap-4">
        {/* Command Palette Mock Search */}
        <div className="relative w-64 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search everything..."
            className="w-full h-8 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary transition-all duration-150"
            disabled
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-1 bg-white border border-slate-200 rounded text-[9px] font-medium text-slate-400 select-none shadow-[0_1px_1px_rgba(0,0,0,0.02)]">
            ⌘K
          </kbd>
        </div>

        {/* Dynamic Date display */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-medium text-slate-600 select-none">
          <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
          <span>{today}</span>
        </div>

        {/* Quick Help */}
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <HelpCircle className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}
