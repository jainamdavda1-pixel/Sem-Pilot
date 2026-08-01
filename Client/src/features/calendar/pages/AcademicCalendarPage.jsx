import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  BookOpen,
  CloudLightning,
  Info,
  MapPin,
  X,
  Plus
} from "lucide-react";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";
import { projectSemesterLectures, mergeLogsAndProjections } from "../../analytics/utils/projectionUtils";
import { AssignmentDetailsModal } from "../../assignments/components/AssignmentDetailsModal";

export function AcademicCalendarPage() {
  const { setupData, attendanceLogs, loading: dataLoading } = useAcademicData();
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const userId = localStorage.getItem("userId") || "default-user";

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/v1/assignments?userId=${userId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAssignments(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Project scheduled lectures
  const mergedLectures = useMemo(() => {
    if (!setupData) return [];
    const projected = projectSemesterLectures(
      setupData.semesterInfo,
      setupData.timetableEntries || [],
      setupData.holidays || []
    );
    return mergeLogsAndProjections(projected, attendanceLogs || []);
  }, [setupData, attendanceLogs]);

  // Group everything by Date (YYYY-MM-DD)
  const calendarEvents = useMemo(() => {
    const map = {};

    // 1. Group Lectures
    mergedLectures.forEach((lec) => {
      if (!map[lec.date]) map[lec.date] = { lectures: [], holidays: [], assignments: [] };
      map[lec.date].lectures.push(lec);
    });

    // 2. Group Holidays
    setupData?.holidays?.forEach((h) => {
      const dateStr = new Date(h.date).toISOString().split("T")[0];
      if (!map[dateStr]) map[dateStr] = { lectures: [], holidays: [], assignments: [] };
      map[dateStr].holidays.push(h);
    });

    // 3. Group Assignments
    assignments.forEach((ass) => {
      if (!ass.dueDate) return;
      const dateStr = new Date(ass.dueDate).toISOString().split("T")[0];
      if (!map[dateStr]) map[dateStr] = { lectures: [], holidays: [], assignments: [] };
      map[dateStr].assignments.push(ass);
    });

    return map;
  }, [mergedLectures, setupData, assignments]);

  // Calendar setup
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid = useMemo(() => {
    const list = [];
    const padding = (firstDay + 6) % 7; // Monday start
    for (let i = 0; i < padding; i++) {
      list.push({ isPadding: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const events = calendarEvents[dateStr] || { lectures: [], holidays: [], assignments: [] };
      list.push({
        isPadding: false,
        dayNumber: day,
        dateString: dateStr,
        ...events
      });
    }
    return list;
  }, [year, month, daysInMonth, firstDay, calendarEvents]);

  const handlePrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNext = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDayBlockColor = (cell) => {
    if (cell.holidays?.length > 0) return "bg-amber-50/50 border-amber-100 hover:border-amber-300";
    if (cell.assignments?.length > 0) {
      const hasPending = cell.assignments.some(a => a.status === "PENDING" || a.status === "IN_PROGRESS");
      return hasPending
        ? "bg-indigo-50/30 border-indigo-100 hover:border-indigo-300"
        : "bg-slate-50 border-slate-200 hover:border-slate-350";
    }
    return "bg-white border-slate-100 hover:border-slate-350";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 select-none">
      {/* Calendar Board */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> {monthName}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              className="p-1 border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 border border-slate-200 rounded-md hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 select-none">
          {daysGrid.map((cell, idx) => {
            if (cell.isPadding) {
              return <div key={`pad-${idx}`} className="aspect-square bg-slate-50/40 rounded-lg border border-transparent" />;
            }

            const isSelected = selectedDay?.dateString === cell.dateString;

            return (
              <button
                key={cell.dateString}
                onClick={() => setSelectedDay(cell)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-between p-1.5 border transition cursor-pointer ${
                  isSelected ? "border-primary bg-primary/5" : getDayBlockColor(cell)
                }`}
              >
                <span className="text-[10px] font-bold text-slate-600 self-start">{cell.dayNumber}</span>
                <div className="flex flex-wrap gap-0.5 justify-center max-w-full">
                  {cell.holidays.map((h, i) => (
                    <span key={`h-${i}`} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  ))}
                  {cell.lectures.slice(0, 2).map((l, i) => (
                    <span
                      key={`l-${i}`}
                      className={`w-1.5 h-1.5 rounded-full ${
                        l.status === "Present" ? "bg-emerald-500" : l.status === "Absent" ? "bg-rose-500" : "bg-blue-300"
                      }`}
                    />
                  ))}
                  {cell.assignments.slice(0, 2).map((a, i) => (
                    <span
                      key={`a-${i}`}
                      className={`w-1.5 h-1.5 rounded-full ${
                        a.status === "COMPLETED" || a.status === "SUBMITTED" ? "bg-slate-400" : "bg-indigo-500"
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-400 select-none uppercase">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-300" /> Lecture</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Assignment</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Holiday</div>
        </div>
      </div>

      {/* Side event drawer details */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col min-h-[300px]">
        {selectedDay ? (
          <div className="space-y-4 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Events</h4>
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

            {/* List entries */}
            <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-3.5 max-h-[340px]">
              {selectedDay.holidays.map((h, i) => (
                <div key={`h-${i}`} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs flex gap-3 items-start text-amber-900 leading-normal">
                  <Info className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Holiday: {h.title}</span>
                    <p className="opacity-80">{h.description || "Campus holiday closure."}</p>
                  </div>
                </div>
              ))}

              {selectedDay.assignments.map((a, i) => (
                <div
                  key={`a-${i}`}
                  onClick={() => setSelectedAssignment(a)}
                  className="p-3 bg-indigo-50/30 border border-indigo-100 hover:border-indigo-250 rounded-xl text-xs flex gap-3 items-start text-indigo-900 cursor-pointer transition"
                >
                  <BookOpen className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold block truncate">{a.title}</span>
                    <p className="text-[10px] text-indigo-500 font-semibold uppercase mt-0.5">
                      Assignment ({a.status})
                    </p>
                  </div>
                </div>
              ))}

              {selectedDay.lectures.map((l, i) => (
                <div key={`l-${i}`} className="p-3 border border-slate-100 rounded-xl text-xs flex gap-3 items-start">
                  <span className={`w-6 h-6 rounded shrink-0 flex items-center justify-center text-[9px] font-extrabold ${
                    l.status === "Present" ? "bg-emerald-500 text-white" : l.status === "Absent" ? "bg-rose-500 text-white" : "bg-blue-100 text-blue-600"
                  }`}>
                    {l.status ? l.status.charAt(0) : "L"}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 block">{l.subjectName}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{l.startTime} - {l.endTime} ({l.lectureType})</span>
                    </div>
                  </div>
                </div>
              ))}

              {selectedDay.holidays.length === 0 &&
               selectedDay.assignments.length === 0 &&
               selectedDay.lectures.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
                  <Info className="w-8 h-8 text-slate-350 mb-2" />
                  <p className="text-xs font-semibold">No lectures or assignments today.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
            <Calendar className="w-10 h-10 text-slate-300 mb-3" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select a Date</h4>
              <p className="text-[10px] max-w-[180px] mx-auto">Click any date block to view scheduled lecture slots, holidays, and assignment goals.</p>
            </div>
          </div>
        )}
      </div>

      <AssignmentDetailsModal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        assignment={selectedAssignment}
        onUpdate={fetchAssignments}
        onDelete={fetchAssignments}
      />
    </div>
  );
}
