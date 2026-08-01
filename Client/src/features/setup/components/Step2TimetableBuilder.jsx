import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Plus, X, Calendar, User, Clock, AlertTriangle, MapPin, Upload } from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { cn } from "../../../shared/utils/utils";
import { UploadZone } from "../../timetable/components/UploadZone";

// Helper to convert time string (HH:MM) to total minutes
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

export function Step2TimetableBuilder() {
  const { watch, setValue } = useFormContext();
  const timetableEntries = watch("timetableEntries") || [];
  const timetableRepeats = watch("timetableRepeats") ?? true;

  // Local state for upload mode toggle
  const [isUploading, setIsUploading] = useState(false);

  // Local state for edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null); // { day, slotIndex }
  
  // Modal input fields
  const [subjectName, setSubjectName] = useState("");
  const [lectureType, setLectureType] = useState("Theory");
  const [facultyName, setFacultyName] = useState("");
  const [room, setRoom] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  // Grid layout variables
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const slots = [
    { label: "09:00 - 10:00", start: "09:00", end: "10:00" },
    { label: "10:00 - 11:00", start: "10:00", end: "11:00" },
    { label: "11:00 - 12:00", start: "11:00", end: "12:00" },
    { label: "12:00 - 13:00", start: "12:00", end: "13:00" },
    { label: "13:00 - 14:00", start: "13:00", end: "14:00" },
    { label: "14:00 - 15:00", start: "14:00", end: "15:00" },
    { label: "15:00 - 16:00", start: "15:00", end: "16:00" },
    { label: "16:00 - 17:00", start: "16:00", end: "17:00" },
  ];

  // Auto-suggestions & autofill lists based on currently scheduled classes
  const uniqueSubjects = [...new Set(timetableEntries.map((e) => e.subjectName).filter(Boolean))];

  // Find a previously entered faculty for a given subject
  const findFacultyForSubject = (name) => {
    const match = timetableEntries.find(
      (e) => e.subjectName?.toLowerCase() === name?.toLowerCase() && e.facultyName
    );
    return match ? match.facultyName : "";
  };

  const handleSubjectInputChange = (val) => {
    setSubjectName(val);
    const autoFaculty = findFacultyForSubject(val);
    if (autoFaculty) {
      setFacultyName(autoFaculty);
    }
  };

  // Check if a specific entry overlaps with any other scheduled lecture
  const checkOverlap = (day, start, end, slotIndex) => {
    const s1 = timeToMinutes(start);
    const e1 = timeToMinutes(end);
    if (s1 >= e1) return false; // Invalid times don't count as overlaps here

    return timetableEntries.some((entry) => {
      // Don't compare with the exact cell we are currently editing
      if (entry.day === day && entry.slotIndex === slotIndex) {
        return false;
      }
      if (entry.day !== day) return false;

      const s2 = timeToMinutes(entry.startTime);
      const e2 = timeToMinutes(entry.endTime);

      // Overlap logic: s1 < e2 AND s2 < e1
      return s1 < e2 && s2 < e1;
    });
  };

  // Cell Click Trigger
  const handleCellClick = (day, slotIndex) => {
    const existing = timetableEntries.find(
      (e) => 
        e.day?.trim().toLowerCase() === day?.trim().toLowerCase() && 
        Number(e.slotIndex) === Number(slotIndex)
    );
    setActiveCell({ day, slotIndex });

    if (existing) {
      setSubjectName(existing.subjectName || "");
      setLectureType(existing.lectureType || "Theory");
      setFacultyName(existing.facultyName || "");
      setRoom(existing.room || "");
      setStartTime(existing.startTime || slots[slotIndex].start);
      setEndTime(existing.endTime || slots[slotIndex].end);
    } else {
      setSubjectName("");
      setLectureType("Theory");
      setFacultyName("");
      setRoom("");
      setStartTime(slots[slotIndex].start);
      setEndTime(slots[slotIndex].end);
    }

    setIsModalOpen(true);
  };

  // Save changes
  const handleSave = () => {
    if (!subjectName.trim()) {
      alert("Subject name is required.");
      return;
    }
    if (!facultyName.trim()) {
      alert("Faculty name is required.");
      return;
    }

    const startVal = timeToMinutes(startTime);
    const endVal = timeToMinutes(endTime);
    if (startVal >= endVal) {
      alert("End time must be after start time.");
      return;
    }

    const { day, slotIndex } = activeCell;

    const newEntry = {
      day,
      slotIndex,
      subjectName: subjectName.trim(),
      lectureType,
      facultyName: facultyName.trim(),
      room: room.trim() || undefined,
      startTime,
      endTime,
    };

    // Filter out existing and append new
    const updated = timetableEntries.filter(
      (e) => !(e.day === day && e.slotIndex === slotIndex)
    );
    updated.push(newEntry);

    setValue("timetableEntries", updated);
    setIsModalOpen(false);
    setActiveCell(null);
  };

  // Delete current cell entry
  const handleDelete = () => {
    const { day, slotIndex } = activeCell;
    const updated = timetableEntries.filter(
      (e) => !(e.day === day && e.slotIndex === slotIndex)
    );
    setValue("timetableEntries", updated);
    setIsModalOpen(false);
    setActiveCell(null);
  };

  const handleUploadSuccess = (data) => {
    setValue("timetableEntries", data);
    setIsUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none pb-4 border-b border-slate-100">
        <div className="space-y-1 text-left">
          <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Weekly Timetable Builder</h3>
          <p className="text-xs text-slate-500">
            Populate your weekly lectures directly into the grid or upload a spreadsheet.
          </p>
        </div>

        {/* Tab Controls to switch manual/upload */}
        <div className="flex border border-slate-200 rounded-md p-0.5 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setIsUploading(false)}
            className={cn(
              "h-8 px-4 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              !isUploading ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Manual Grid
          </button>
          <button
            type="button"
            onClick={() => setIsUploading(true)}
            className={cn(
              "h-8 px-4 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              isUploading ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Upload className="w-3.5 h-3.5" />
            Import File
          </button>
        </div>
      </div>

      {isUploading ? (
        <div className="py-8 bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="max-w-md mx-auto space-y-1.5 select-none">
            <h4 className="text-sm font-semibold text-slate-800">Import Timetable Spreadsheet</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload your semester schedule. We'll populate your grid and auto-generate subjects for the next step.
            </p>
          </div>
          <UploadZone onUploadSuccess={handleUploadSuccess} />
        </div>
      ) : (
        /* Grid view */
        <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden select-none animate-in fade-in duration-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left table-fixed min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3 w-28 border-r border-slate-200 text-center">Time</th>
                {days.map((day) => (
                  <th key={day} className="p-3 border-r border-slate-200 last:border-r-0 text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, slotIdx) => (
                <tr key={slotIdx} className="border-b border-slate-100 last:border-b-0 h-16 group">
                  {/* Time slots label */}
                  <td className="p-3 border-r border-slate-200 bg-slate-50/10 text-center flex flex-col justify-center h-16">
                    <span className="text-[10px] font-semibold text-slate-700">{slot.label}</span>
                  </td>

                  {/* Daily cells */}
                  {days.map((day) => {
                    const entry = timetableEntries.find(
                      (e) => 
                        e.day?.trim().toLowerCase() === day?.trim().toLowerCase() && 
                        Number(e.slotIndex) === Number(slotIdx)
                    );
                    const hasConflict = entry && checkOverlap(day, entry.startTime, entry.endTime, slotIdx);

                    return (
                      <td
                        key={day}
                        onClick={() => handleCellClick(day, slotIdx)}
                        className={cn(
                          "p-1.5 border-r border-slate-200 last:border-r-0 cursor-pointer transition-colors duration-100 vertical-middle text-center h-16 align-middle",
                          entry
                            ? hasConflict
                              ? "bg-red-50/40 hover:bg-red-50/60"
                              : "bg-blue-50/20 hover:bg-blue-50/40"
                            : "hover:bg-slate-50/80"
                        )}
                      >
                        {entry ? (
                          <div className={cn(
                            "h-full rounded border p-1 text-left flex flex-col justify-between shadow-[0_1px_1px_rgba(0,0,0,0.01)] transition-colors bg-white",
                            hasConflict 
                              ? "border-red-200 shadow-sm"
                              : "border-blue-100"
                          )}>
                            <div className="flex items-start justify-between gap-1">
                              <span className={cn(
                                "text-[10px] font-semibold truncate block max-w-full leading-tight",
                                hasConflict ? "text-red-700" : "text-slate-800"
                              )}>
                                {entry.subjectName}
                              </span>
                              {hasConflict ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" title="Conflict: Overlapping lecture" />
                              ) : (
                                <span className={cn(
                                  "text-[8px] font-bold px-1 rounded shrink-0",
                                  entry.lectureType === "Theory"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-blue-50 text-primary border border-blue-100"
                                )}>
                                  {entry.lectureType === "Theory" ? "TH" : "LAB"}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1 select-none">
                              <span className="truncate flex items-center gap-0.5">
                                <User className="w-2.5 h-2.5 shrink-0" />
                                {entry.facultyName}
                              </span>
                              <span className="shrink-0 font-medium">
                                {entry.startTime}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full w-full rounded flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Repeat options */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={timetableRepeats}
            onChange={(e) => setValue("timetableRepeats", e.target.checked)}
            className="w-4.5 h-4.5 text-primary border-slate-300 rounded focus:ring-primary accent-primary"
          />
          <div className="text-left">
            <span className="text-sm font-semibold text-slate-700 block">
              Repeats Weekly
            </span>
            <span className="text-xs text-slate-400">
              This schedule is automatically synchronized for the entire semester.
            </span>
          </div>
        </label>
      </div>

      {/* Modal dialog overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 shadow-md rounded-lg max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {timetableEntries.some((e) => e.day === activeCell.day && e.slotIndex === activeCell.slotIndex)
                  ? "Edit Lecture"
                  : "Schedule Lecture"}
                ({activeCell?.day.slice(0, 3)})
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4 text-left">
              {/* Overlap warnings check in modal */}
              {checkOverlap(activeCell.day, startTime, endTime, activeCell.slotIndex) && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-xs text-red-700 flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Overlap Conflict Detected</span>
                    <p className="text-[10px] text-red-600 mt-0.5">
                      This time slot overlaps with another scheduled class on {activeCell.day}.
                    </p>
                  </div>
                </div>
              )}

              {/* Subject Name with autocomplete datalist */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Subject Name
                </label>
                <input
                  type="text"
                  list="setup-subjects-suggest"
                  value={subjectName}
                  onChange={(e) => handleSubjectInputChange(e.target.value)}
                  placeholder="e.g. Mathematics, Physics"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <datalist id="setup-subjects-suggest">
                  {uniqueSubjects.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* Type Grid */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Class Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Theory", "Lab"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLectureType(t)}
                      className={cn(
                        "h-8 rounded text-xs font-semibold border transition-colors select-none",
                        lectureType === t
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Faculty Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Faculty Name
                </label>
                <input
                  type="text"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  placeholder="e.g. Dr. Abel"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Room (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Room (Optional)
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Room 402, Lab A"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Timings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 mt-4">
                {timetableEntries.some(
                  (e) => e.day === activeCell.day && e.slotIndex === activeCell.slotIndex
                ) && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 mr-auto text-xs h-8"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 ml-auto text-xs"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSave}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Step2TimetableBuilder;
