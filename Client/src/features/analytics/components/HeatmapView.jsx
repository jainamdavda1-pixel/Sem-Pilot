import React, { useMemo, useState } from "react";
import { Info, HelpCircle } from "lucide-react";

export function HeatmapView({ mergedLectures, semesterInfo }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Group logs by date
  const dayStats = useMemo(() => {
    const map = {};
    mergedLectures.forEach((lec) => {
      if (!map[lec.date]) {
        map[lec.date] = {
          date: lec.date,
          present: 0,
          absent: 0,
          cancelled: 0,
          holiday: 0,
          subjects: new Set()
        };
      }
      if (lec.isLogged) {
        if (lec.status === "Present") map[lec.date].present++;
        else if (lec.status === "Absent") map[lec.date].absent++;
        else if (lec.status === "Cancelled") map[lec.date].cancelled++;
        else if (lec.status === "Holiday") map[lec.date].holiday++;
        map[lec.date].subjects.add(lec.subjectName);
      } else if (lec.status === "Holiday") {
        map[lec.date].holiday++;
      }
    });
    return map;
  }, [mergedLectures]);

  // Construct weeks grid from semesterStartDate to semesterEndDate
  const heatmapGrid = useMemo(() => {
    if (!semesterInfo?.semesterStartDate || !semesterInfo?.semesterEndDate) {
      return [];
    }

    const start = new Date(semesterInfo.semesterStartDate);
    const end = new Date(semesterInfo.semesterEndDate);

    // Adjust start date to previous Monday to align grid row indexes
    // Monday is index 0, Sunday is index 6
    const startDay = (start.getDay() + 6) % 7;
    const gridStart = new Date(start);
    gridStart.setDate(gridStart.getDate() - startDay);

    const weeks = [];
    let current = new Date(gridStart);

    while (current <= end || weeks.length < 16) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dStr = current.toISOString().split("T")[0];
        const stats = dayStats[dStr] || {
          date: dStr,
          present: 0,
          absent: 0,
          cancelled: 0,
          holiday: 0,
          subjects: new Set()
        };

        const totalActive = stats.present + stats.absent;
        const pct = totalActive > 0 ? (stats.present / totalActive) * 100 : null;

        // Verify if date is within actual boundaries
        const isWithinSemester = current >= start && current <= end;

        weekDays.push({
          dateStr: dStr,
          dayIndex: d, // 0 = Mon, 6 = Sun
          present: stats.present,
          absent: stats.absent,
          cancelled: stats.cancelled,
          holiday: stats.holiday,
          subjects: Array.from(stats.subjects),
          percentage: pct,
          isWithinSemester
        });

        current.setDate(current.getDate() + 1);
      }
      weeks.push(weekDays);
      
      // Safety limit to avoid infinite loop
      if (weeks.length > 52) break;
    }

    return weeks;
  }, [semesterInfo, dayStats]);

  // Cell coloring based on percentage
  const getCellColorClass = (cell) => {
    if (!cell.isWithinSemester) {
      return "bg-slate-50/20 border-transparent cursor-not-allowed";
    }

    const total = cell.present + cell.absent;
    if (total === 0) {
      if (cell.holiday > 0) return "bg-amber-100 border-amber-200";
      if (cell.cancelled > 0) return "bg-slate-100 border-slate-200";
      return "bg-slate-50 border-slate-100"; // Empty cell
    }

    if (cell.percentage === 100) return "bg-emerald-500 border-emerald-600";
    if (cell.percentage >= 75) return "bg-emerald-300 border-emerald-400";
    if (cell.percentage >= 50) return "bg-amber-300 border-amber-400";
    if (cell.percentage > 0) return "bg-rose-300 border-rose-400";
    return "bg-rose-500 border-rose-600"; // 0% present
  };

  const weekdaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-6 text-left font-sans relative">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Attendance Intensity Heatmap</h3>
        <p className="text-[11px] text-slate-400">GitHub-style visualization of your daily attendance consistency throughout the semester.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start overflow-x-auto py-2">
        {/* Heatmap Grid Wrapper */}
        <div className="flex gap-2">
          {/* Weekday labels */}
          <div className="flex flex-col justify-between h-[126px] pr-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none pt-1">
            {weekdaysShort.map((day, idx) => (
              <span key={day} className={idx % 2 === 0 ? "visible" : "invisible"}>
                {day}
              </span>
            ))}
          </div>

          {/* Grid Blocks */}
          <div className="flex gap-1">
            {heatmapGrid.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((cell) => (
                  <div
                    key={cell.dateStr}
                    onMouseEnter={(e) => {
                      if (cell.isWithinSemester) {
                        setHoveredCell({
                          ...cell,
                          x: e.currentTarget.offsetLeft,
                          y: e.currentTarget.offsetTop
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`w-3.5 h-3.5 rounded border transition-all ${getCellColorClass(
                      cell
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-row md:flex-col gap-x-4 gap-y-2 select-none text-[10px] font-semibold text-slate-500 mt-2 md:mt-0 md:pl-4 md:border-l md:border-slate-50">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block select-none">
            Legend
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded border bg-slate-50 border-slate-100" />
            <span>No Classes Logged</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded border bg-rose-500 border-rose-600" />
            <span>0% Attended</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded border bg-amber-300 border-amber-400" />
            <span>50% - 74% Attended</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded border bg-emerald-300 border-emerald-400" />
            <span>75% - 99% Attended</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded border bg-emerald-500 border-emerald-600" />
            <span>100% Attended</span>
          </div>
        </div>
      </div>

      {/* Dynamic Hover Tooltip Card */}
      {hoveredCell && (
        <div
          className="absolute z-20 bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1.5 pointer-events-none max-w-xs border border-slate-800"
          style={{
            left: `${Math.min(hoveredCell.x + 24, 500)}px`,
            top: `${Math.max(hoveredCell.y - 60, 0)}px`
          }}
        >
          <span className="font-bold block border-b border-slate-800 pb-1 mb-1">
            {new Date(hoveredCell.dateStr).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </span>
          <div className="space-y-0.5 opacity-90 font-medium">
            {hoveredCell.present + hoveredCell.absent > 0 ? (
              <>
                <p>Present: <strong className="text-emerald-400">{hoveredCell.present}</strong></p>
                <p>Absent: <strong className="text-rose-400">{hoveredCell.absent}</strong></p>
                <p>Attendance: <strong>{Math.round(hoveredCell.percentage)}%</strong></p>
                {hoveredCell.subjects.length > 0 && (
                  <p className="text-[10px] text-slate-400 pt-1 leading-normal">
                    Subjects: {hoveredCell.subjects.join(", ")}
                  </p>
                )}
              </>
            ) : (
              <p className="text-slate-400">No active classes logged.</p>
            )}
            {hoveredCell.holiday > 0 && <p className="text-amber-400 font-bold">Holiday / Break</p>}
            {hoveredCell.cancelled > 0 && <p className="text-slate-400 font-bold">Session Cancelled</p>}
          </div>
        </div>
      )}
    </div>
  );
}
