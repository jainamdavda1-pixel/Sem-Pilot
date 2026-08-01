import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Download, 
  Trash2, 
  Plus, 
  FileText, 
  Upload, 
  Edit3, 
  Check, 
  X, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { UploadZone } from "../components/UploadZone";
import { TimetableMetrics } from "../components/TimetableMetrics";
import { TimetablePreview } from "../components/TimetablePreview";
import { calculateAttendanceStats } from "../../attendance/utils/attendanceUtils";
import { exportToJSONTimetable, timeToMinutes } from "../utils/parser";
import { cn, syncFullDataToBackend } from "../../../shared/utils/utils";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";

export default function TimetablePage() {
  const navigate = useNavigate();
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [timetableRepeats, setTimetableRepeats] = useState(true);
  const [isSetupLoaded, setIsSetupLoaded] = useState(false);
  const [fileName, setFileName] = useState("");

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null); // { day, slotIndex }
  const [subjectName, setSubjectName] = useState("");
  const [lectureType, setLectureType] = useState("Theory");
  const [facultyName, setFacultyName] = useState("");
  const [room, setRoom] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

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

  const { setupData, attendanceLogs, loading, refreshData } = useAcademicData();

  useEffect(() => {
    if (setupData) {
      setTimetableEntries(setupData.timetableEntries || []);
      setTimetableRepeats(setupData.timetableRepeats ?? true);
      setIsSetupLoaded(true);
    }
  }, [setupData]);

  // Save changes to local state & database
  const saveToLocal = (newEntries) => {
    setTimetableEntries(newEntries);
    const current = setupData || {};

    // Auto-sync subjects based on timetable entries
    const uniqueSubjectNames = [...new Set(newEntries.map((e) => e.subjectName).filter(Boolean))];
    const existingSubjects = current.subjects || [];
    const updatedSubjects = uniqueSubjectNames.map((name) => {
      const match = existingSubjects.find((s) => s.name?.toLowerCase() === name?.toLowerCase());
      if (match) {
        return match;
      } else {
        return {
          name: name,
          code: `${name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          facultyRating: 3,
          facultyStrictness: "medium",
          priority: "medium"
        };
      }
    });
    
    const updated = {
      ...current,
      timetableEntries: newEntries,
      subjects: updatedSubjects,
      timetableRepeats: timetableRepeats,
    };
    
    syncFullDataToBackend(updated, attendanceLogs).then(() => refreshData());
  };

  const handleUploadSuccess = (data, uploadedName) => {
    saveToLocal(data);
    setFileName(uploadedName);
  };

  const resetTimetable = () => {
    if (window.confirm("Are you sure you want to reset and clear the current timetable?")) {
      saveToLocal([]);
      setFileName("");
    }
  };

  // Download parsed schedule as expected nested JSON Format
  const downloadJSON = () => {
    const nested = exportToJSONTimetable(timetableEntries);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nested, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "sempilot_timetable.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // Modal actions
  const handleEditCell = (day, slotIdx) => {
    const existing = timetableEntries.find((e) => e.day === day && e.slotIndex === slotIdx);
    setActiveCell({ day, slotIndex: slotIdx });

    if (existing) {
      setSubjectName(existing.subjectName || "");
      setLectureType(existing.lectureType || "Theory");
      setFacultyName(existing.facultyName || "");
      setRoom(existing.room || "");
      setStartTime(existing.startTime || slots[slotIdx].start);
      setEndTime(existing.endTime || slots[slotIdx].end);
    } else {
      setSubjectName("");
      setLectureType("Theory");
      setFacultyName("");
      setRoom("");
      setStartTime(slots[slotIdx].start);
      setEndTime(slots[slotIdx].end);
    }
    setIsModalOpen(true);
  };

  const checkOverlap = (day, start, end, slotIndex) => {
    const s1 = timeToMinutes(start);
    const e1 = timeToMinutes(end);
    if (s1 >= e1) return false;

    return timetableEntries.some((entry) => {
      if (entry.day === day && entry.slotIndex === slotIndex) return false;
      if (entry.day !== day) return false;
      const s2 = timeToMinutes(entry.startTime);
      const e2 = timeToMinutes(entry.endTime);
      return s1 < e2 && s2 < e1;
    });
  };

  const handleSaveLecture = () => {
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

    const updated = timetableEntries.filter(
      (e) => !(e.day === day && e.slotIndex === slotIndex)
    );
    updated.push(newEntry);
    saveToLocal(updated);
    setIsModalOpen(false);
  };

  const handleDeleteLecture = () => {
    const { day, slotIndex } = activeCell;
    const updated = timetableEntries.filter(
      (e) => !(e.day === day && e.slotIndex === slotIndex)
    );
    saveToLocal(updated);
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!setupData) {
    return (
      <div className="p-12 border border-dashed border-slate-200 bg-white rounded-lg flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto mt-12 shadow-sm font-sans text-slate-800">
        <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-slate-800 tracking-tight">Onboarding Required</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Please run the import wizard to configure your semester boundary, faculties, subjects, and timetable schedule.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate("/import")}>
          Run Import Wizard
        </Button>
      </div>
    );
  }

  const uniqueSubjectsList = [...new Set(timetableEntries.map((e) => e.subjectName).filter(Boolean))];
  const subjects = setupData?.subjects || [];
  const attendanceRequirement = setupData?.semesterInfo?.attendanceRequirement || 75;
  const calculatedStats = calculateAttendanceStats(attendanceLogs || [], subjects, attendanceRequirement);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <SectionHeader
        title="Weekly Timetable Manager"
        description="View your active lectures grid or import standard Excel spreadsheets and JSON configurations."
      >
        {timetableEntries.length > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={downloadJSON}>
              <Download className="w-4 h-4 mr-1.5" />
              Download JSON
            </Button>
            <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50 border-red-100 hover:text-red-600" onClick={resetTimetable}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Reset Timetable
            </Button>
          </>
        )}
      </SectionHeader>

      {isSetupLoaded && (
        <>
          {timetableEntries.length > 0 ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Metrics row */}
              <TimetableMetrics entries={timetableEntries} />

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Grid Preview */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex justify-between items-center select-none">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Weekly Schedule view
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium select-none">
                      <span>Click any cell to add/edit lectures</span>
                    </div>
                  </div>
                  <TimetablePreview entries={timetableEntries} onUpdateEntries={saveToLocal} />
                </div>

                {/* Right Column: Subject Attendance Breakdown List */}
                <div className="lg:col-span-4 space-y-4 text-left">
                  <div className="flex items-center justify-between select-none">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Subject Attendance Health
                    </h4>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                      Target: {attendanceRequirement}%
                    </span>
                  </div>

                  {calculatedStats.subjectStats.length === 0 ? (
                    <Card className="border border-slate-200 bg-white">
                      <CardContent className="p-6 text-center text-slate-400 text-xs select-none">
                        No subject logs tracked yet.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {calculatedStats.subjectStats.map((sub, idx) => {
                        const hasConducted = sub.total > 0;
                        const isSafe = sub.percentage >= attendanceRequirement;
                        const progressPercent = hasConducted ? sub.percentage : 0;

                        return (
                          <Card key={idx} className="border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors">
                            <CardContent className="p-4 space-y-3">
                              {/* Subject header */}
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-0.5">
                                  <h5 className="text-xs font-bold text-slate-800 tracking-tight leading-snug">
                                    {sub.name}
                                  </h5>
                                  <div className="flex items-center gap-1.5 pt-0.5 select-none">
                                    <span className={cn(
                                      "text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider",
                                      sub.priority === "very_high" || sub.priority === "high"
                                        ? "bg-rose-50 text-rose-600 border-rose-100"
                                        : "bg-slate-50 text-slate-500 border-slate-200/60"
                                    )}>
                                      {sub.priority.replace("_", " ")}
                                    </span>
                                  </div>
                                </div>
                                {hasConducted && (
                                  <span className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 select-none",
                                    sub.marginType === "success"
                                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                      : sub.marginType === "warning"
                                        ? "bg-amber-50 text-amber-600 border-amber-100"
                                        : "bg-rose-50 text-rose-600 border-rose-100"
                                  )}>
                                    {sub.marginText}
                                  </span>
                                )}
                              </div>

                              {/* Progress metrics */}
                              <div className="space-y-1.5 pt-0.5">
                                <div className="flex justify-between items-baseline text-xs select-none">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-extrabold text-slate-800 tracking-tight">
                                      {hasConducted ? `${sub.percentage}%` : "--"}
                                    </span>
                                    {hasConducted && (
                                      <span className="text-[9px] text-slate-400 font-semibold uppercase">
                                        rate
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {sub.attended} / {sub.total} classes
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all duration-300",
                                      !hasConducted 
                                        ? "bg-slate-300"
                                        : isSafe 
                                          ? "bg-emerald-500" 
                                          : sub.percentage >= attendanceRequirement - 5 
                                            ? "bg-amber-500" 
                                            : "bg-rose-500"
                                    )}
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            /* Upload Zone if no active schedule */
            <div className="py-12 bg-white rounded-xl border border-slate-200 shadow-sm text-center space-y-6 animate-in fade-in duration-200">
              <div className="max-w-md mx-auto space-y-1.5 px-4 select-none">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">No Timetable Configured</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  SemPilot requires a timetable to initialize buffer ratios and roadmaps. Upload your official spreadsheet or build it manually.
                </p>
              </div>

              <UploadZone onUploadSuccess={handleUploadSuccess} />

              <div className="pt-2 select-none">
                <span className="text-xs text-slate-400">
                  Or schedule manually instead:{" "}
                  <button
                    onClick={() => saveToLocal([{
                      day: "Monday",
                      slotIndex: 0,
                      subjectName: "Sample subject",
                      lectureType: "Theory",
                      facultyName: "Prof. Holt",
                      startTime: "09:00",
                      endTime: "10:00"
                    }])}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Load Mock Template
                  </button>
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Lecture Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 shadow-md rounded-lg max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider select-none font-sans">
                {timetableEntries.some((e) => e.day === activeCell.day && e.slotIndex === activeCell.slotIndex)
                  ? "Edit Schedule Slot"
                  : "Add Schedule Slot"}
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

            {/* Content Form */}
            <div className="p-4 space-y-4 text-left">
              {/* Overlap warnings checks */}
              {checkOverlap(activeCell.day, startTime, endTime, activeCell.slotIndex) && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-xs text-red-700 flex gap-2 items-start">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Overlapping Lecture</span>
                    <p className="text-[10px] text-red-600 mt-0.5">
                      This schedule overlaps with another lecture on {activeCell.day}.
                    </p>
                  </div>
                </div>
              )}

              {/* Subject Name Input with suggestions */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">
                  Subject Name
                </label>
                <input
                  type="text"
                  list="suggest-subjects-list"
                  value={subjectName}
                  onChange={(e) => {
                    setSubjectName(e.target.value);
                    // Match faculty
                    const found = timetableEntries.find(
                      (en) => en.subjectName?.toLowerCase() === e.target.value?.toLowerCase() && en.facultyName
                    );
                    if (found) setFacultyName(found.facultyName);
                  }}
                  placeholder="e.g. Operating Systems"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <datalist id="suggest-subjects-list">
                  {uniqueSubjectsList.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* Class type buttons */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">
                  Lecture Type
                </label>
                <div className="grid grid-cols-2 gap-2 select-none">
                  {["Theory", "Lab"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLectureType(t)}
                      className={cn(
                        "h-8 rounded text-xs font-semibold border transition-colors",
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">
                  Faculty Name
                </label>
                <input
                  type="text"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1"
                />
              </div>

              {/* Room (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">
                  Room / Class Code (Optional)
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Room 402, Lab 1"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1"
                />
              </div>

              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-3 select-none">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
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
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 mt-4 select-none">
                {timetableEntries.some(
                  (e) => e.day === activeCell.day && e.slotIndex === activeCell.slotIndex
                ) && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 mr-auto text-xs h-8"
                    onClick={handleDeleteLecture}
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
                  onClick={handleSaveLecture}
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

