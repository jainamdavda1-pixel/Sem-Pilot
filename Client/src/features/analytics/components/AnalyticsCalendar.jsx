import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Clock,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  HelpCircle,
  X
} from "lucide-react";

export function AnalyticsCalendar({ mergedLectures }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Group all lectures by date string (YYYY-MM-DD)
  const lecturesByDate = useMemo(() => {
    const map = {};
    mergedLectures.forEach((lec) => {
      if (!map[lec.date]) {
        map[lec.date] = [];
      }
      map[lec.date].push(lec);
    });
    return map;
  }, [mergedLectures]);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid = useMemo(() => {
    const days = [];
    
    // Empty padding slots for days before the 1st of the month
    // Align with Monday as start of week (0 = Mon, 6 = Sun)
    const paddingCount = (firstDayOfMonth + 6) % 7;
    for (let i = 0; i < paddingCount; i++) {
      days.push({ isPadding: true });
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayLectures = lecturesByDate[dateStr] || [];

      days.push({
        isPadding: false,
        dayNumber: day,
        dateString: dateStr,
        lectures: dayLectures
      });
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfMonth, lecturesByDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  // Get status color coding
  const getLectureColorClass = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "present":
        return "bg-emerald-500 text-white";
      case "absent":
        return "bg-rose-500 text-white";
      case "holiday":
        return "bg-amber-400 text-white";
      case "cancelled":
        return "bg-slate-400 text-white";
      case "future":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-slate-100 text-slate-400 border border-dashed border-slate-300";
    }
  };

  // Check overall day status to color day block
  const getDayDotColor = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "present": return "bg-emerald-500";
      case "absent": return "bg-rose-500";
      case "holiday": return "bg-amber-400";
      case "cancelled": return "bg-slate-400";
      default: return "bg-blue-300";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-left">
      {/* Calendar Grid card */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm md:col-span-2 space-y-4">
        {/* Selector Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 select-none">
            <Calendar className="w-4 h-4 text-primary" /> {monthName}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Weekday Titles */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 select-none">
          {daysGrid.map((cell, idx) => {
            if (cell.isPadding) {
              return <div key={`pad-${idx}`} className="aspect-square bg-slate-50/50 rounded-lg" />;
            }

            const hasLectures = cell.lectures.length > 0;
            const isSelected = selectedDay?.dateString === cell.dateString;

            return (
              <button
                key={cell.dateString}
                onClick={() => setSelectedDay(cell)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-between p-1.5 border transition cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white"
                }`}
              >
                <span className="text-[10px] font-bold text-slate-600 self-start">
                  {cell.dayNumber}
                </span>

                {/* Status indicator dots */}
                {hasLectures && (
                  <div className="flex gap-0.5 justify-center flex-wrap max-w-full">
                    {cell.lectures.slice(0, 3).map((l, index) => (
                      <span
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDayDotColor(l.status)}`}
                      />
                    ))}
                    {cell.lectures.length > 3 && (
                      <span className="text-[8px] font-bold text-slate-400 shrink-0 leading-none">
                        +
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 justify-start pt-3 border-t border-slate-50 text-[10px] font-semibold text-slate-400 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Holiday
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Cancelled
          </div>
        </div>
      </div>

      {/* Side Details card */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col">
        {selectedDay ? (
          <div className="space-y-4 flex flex-col h-full justify-between">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
                  Day Details
                </h4>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1 hover:bg-slate-100 rounded-md transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {new Date(selectedDay.dateString).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            </div>

            {/* Lectures list */}
            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1 py-2 max-h-[280px]">
              {selectedDay.lectures.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
                  <AlertCircle className="w-8 h-8 text-slate-300" />
                  <p className="text-xs text-slate-400 font-medium">No classes scheduled on this day</p>
                </div>
              ) : (
                selectedDay.lectures.map((lec, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-slate-100 rounded-xl hover:shadow-sm transition-all bg-slate-50/30 text-xs flex gap-3 items-start"
                  >
                    {/* Status Badge Tag */}
                    <div
                      className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[9px] font-extrabold ${getLectureColorClass(
                        lec.status
                      )}`}
                    >
                      {String(lec.status || "F").charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1 text-slate-600 flex-1">
                      <span className="font-bold text-slate-800 block leading-tight">
                        {lec.subjectName}
                      </span>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 select-none">
                        <Clock className="w-3 h-3" />
                        <span>
                          {lec.startTime} - {lec.endTime} ({lec.lectureType})
                        </span>
                      </div>

                      {lec.room && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 select-none">
                          <MapPin className="w-3 h-3" />
                          <span>Room: {lec.room}</span>
                        </div>
                      )}

                      {lec.facultyName && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 select-none">
                          <User className="w-3 h-3" />
                          <span>Prof: {lec.facultyName}</span>
                        </div>
                      )}

                      {lec.remarks && (
                        <p className="text-[10px] text-slate-400 bg-white p-1 rounded border border-slate-100 italic mt-1.5 leading-snug">
                          "{lec.remarks}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 select-none text-slate-400">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select a Day</h4>
              <p className="text-[10px] max-w-[180px]">Click any calendar square to view scheduled lecture details, hours, and remarks.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
