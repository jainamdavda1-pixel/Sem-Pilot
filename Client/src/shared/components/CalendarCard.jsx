import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "./Card";
import { cn } from "../utils/utils";

export function CalendarCard({ className, monthName = "October 2026", events = [] }) {
  // Let's create a static grid of days for a mock month (e.g., starts on Thursday, has 31 days)
  const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  
  // Empty slots before day 1 (let's assume 3 slots for Thursday start)
  const padDays = Array(3).fill(null);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const allDays = [...padDays, ...days];

  // Helper to find events for a day
  const getEventForDay = (day) => {
    if (!day) return null;
    return events.find((e) => e.day === day);
  };

  return (
    <Card className={cn("hover:border-slate-300 transition-colors duration-150", className)}>
      <CardContent className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
            {monthName}
          </h3>
          <div className="flex items-center gap-1 border border-slate-200 rounded-md p-0.5 bg-slate-50/50">
            <button className="p-1 hover:bg-white rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer select-none">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:bg-white rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer select-none">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Weekdays Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1 select-none">
          {weekdays.map((day) => (
            <span key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-6 flex items-center justify-center">
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {allDays.map((day, idx) => {
            const event = getEventForDay(day);
            const isToday = day === 15; // Mock day 15 as today
            
            return (
              <div
                key={idx}
                className={cn(
                  "h-8 rounded flex flex-col items-center justify-center text-xs relative select-none cursor-pointer transition-colors duration-100",
                  !day && "pointer-events-none opacity-0",
                  day && "hover:bg-slate-100/70 text-slate-700",
                  isToday && "bg-primary text-white hover:bg-primary/90 font-semibold"
                )}
              >
                <span>{day}</span>
                {/* Event indicator dot */}
                {event && !isToday && (
                  <span className={cn(
                    "absolute bottom-1 w-1 h-1 rounded-full",
                    event.type === "success" && "bg-emerald-500",
                    event.type === "warning" && "bg-amber-500",
                    event.type === "danger" && "bg-red-500",
                    event.type === "info" && "bg-blue-500"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
