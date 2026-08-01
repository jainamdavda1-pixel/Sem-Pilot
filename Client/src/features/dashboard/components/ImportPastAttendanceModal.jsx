import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  CalendarRange, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ListFilter,
  Check,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { Card, CardContent } from "../../../shared/components/Card";
import { Button } from "../../../shared/components/Button";
import { Progress } from "../../../shared/components/Progress";
import { parseExcelAttendance } from "../../timetable/utils/parser";
import { cn } from "../../../shared/utils/utils";

export function ImportPastAttendanceModal({ isOpen, onClose, setupData, attendanceLogs = [], onSave }) {
  if (!isOpen || !setupData) return null;

  // Active Tab: "manual" | "upload"
  const [activeTab, setActiveTab] = useState("manual");

  // --- State for Manual Tab ---
  const [pastLectures, setPastLectures] = useState([]);
  const [activeImportDate, setActiveImportDate] = useState("");
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth()); // 0-indexed
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // --- State for Upload Tab ---
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null or 0-100
  const [parsedFile, setParsedFile] = useState(null); // { name, size }
  const [uploadedData, setUploadedData] = useState([]); // Parsed records
  const [uploadErrors, setUploadErrors] = useState([]);
  const fileInputRef = useRef(null);

  const getSemesterStartDate = (data) => {
    if (!data) return "";
    return (
      data.semesterInfo?.semesterStartDate ||
      data.semesterInfo?.startDate ||
      data.semesterStartDate ||
      data.startDate ||
      data.dates?.semesterStartDate ||
      data.dates?.startDate ||
      ""
    );
  };

  const startDateStr = getSemesterStartDate(setupData);
  const timetableEntries = setupData.timetableEntries || [];

  // Generate historical past lectures for manual entry on mount/open
  useEffect(() => {
    if (startDateStr) {
      const generated = [];
      const start = new Date(startDateStr);
      const today = new Date();
      const limit = new Date(today);
      limit.setDate(limit.getDate() - 1); // Up to yesterday

      const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      let d = new Date(start);
      if (d <= limit) {
        while (d <= limit) {
          const weekday = weekdays[d.getDay()];
          const dayEntries = timetableEntries.filter(e => e.day?.toLowerCase() === weekday?.toLowerCase());
          
          if (dayEntries.length > 0) {
            const dateStr = d.toISOString().split("T")[0];
            dayEntries.forEach(entry => {
              const match = (attendanceLogs || []).find(
                l => l.date === dateStr && l.subjectName === entry.subjectName && l.startTime === entry.startTime
              );
              
              generated.push({
                date: dateStr,
                weekday: weekday,
                subjectName: entry.subjectName,
                lectureType: entry.lectureType,
                startTime: entry.startTime,
                endTime: entry.endTime,
                status: match ? match.status : null
              });
            });
          }
          d.setDate(d.getDate() + 1);
        }
      }

      generated.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      setPastLectures(generated);

      if (generated.length > 0) {
        const uniqueDates = [...new Set(generated.map(l => l.date))].sort();
        setActiveImportDate(uniqueDates[0]);
      } else {
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        setActiveImportDate(yesterdayStr);
      }
    } else {
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      setActiveImportDate(yesterdayStr);
    }
  }, [isOpen, startDateStr, timetableEntries, attendanceLogs]);

  // --- Manual Mode Actions ---
  // Sync calendar month/year with activeImportDate when it changes
  useEffect(() => {
    if (activeImportDate) {
      const activeDate = new Date(activeImportDate);
      setCalendarYear(activeDate.getFullYear());
      setCalendarMonth(activeDate.getMonth());
    }
  }, [activeImportDate]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const getDaysInMonth = (year, month) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNum: prevMonthTotalDays - i,
        isCurrentMonth: false,
        dateStr: ""
      });
    }
    
    for (let i = 1; i <= totalDays; i++) {
      const mStr = String(month + 1).padStart(2, "0");
      const dStr = String(i).padStart(2, "0");
      const dateStr = `${year}-${mStr}-${dStr}`;
      days.push({
        dayNum: i,
        isCurrentMonth: true,
        dateStr
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNum: i,
        isCurrentMonth: false,
        dateStr: ""
      });
    }
    
    return days;
  };

  const isDateInAllowedRange = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const start = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 90 * 86400 * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    date.setHours(0,0,0,0);
    start.setHours(0,0,0,0);
    yesterday.setHours(0,0,0,0);
    
    return date >= start && date <= yesterday;
  };

  const getClassesForDate = (dateStr) => {
    if (!dateStr) return [];
    return pastLectures.filter(l => l.date === dateStr);
  };

  const getCompletionForDate = (dateStr) => {
    const dayClasses = getClassesForDate(dateStr);
    if (dayClasses.length === 0) return "none";
    const marked = dayClasses.filter(c => c.status !== null).length;
    if (marked === 0) return "unmarked";
    if (marked === dayClasses.length) return "complete";
    return "partial";
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const calendarMonthName = monthNames[calendarMonth];

  const uniqueImportDates = [...new Set(pastLectures.map(l => l.date))].sort();
  const currentImportDateIndex = uniqueImportDates.indexOf(activeImportDate);

  const handlePrevImportDay = () => {
    if (currentImportDateIndex > 0) {
      setActiveImportDate(uniqueImportDates[currentImportDateIndex - 1]);
    }
  };

  const handleNextImportDay = () => {
    if (currentImportDateIndex < uniqueImportDates.length - 1) {
      setActiveImportDate(uniqueImportDates[currentImportDateIndex + 1]);
    }
  };

  const setPastLectureStatus = (item, status) => {
    const updated = pastLectures.map(l => {
      if (l.date === item.date && l.subjectName === item.subjectName && l.startTime === item.startTime) {
        return { ...l, status: l.status === status ? null : status };
      }
      return l;
    });
    setPastLectures(updated);
  };

  const bulkSetPastStatusForDay = (status) => {
    const updated = pastLectures.map(l => {
      if (l.date === activeImportDate) {
        return { ...l, status };
      }
      return l;
    });
    setPastLectures(updated);
  };

  const saveManualImportedAttendance = () => {
    const generatedDates = new Set(pastLectures.map(l => l.date));
    const cleanLogs = (attendanceLogs || []).filter(log => !generatedDates.has(log.date));

    const markedPastLogs = pastLectures
      .filter(l => l.status !== null)
      .map(l => ({
        id: `${l.date}-${l.subjectName}-${l.startTime}`,
        date: l.date,
        subjectName: l.subjectName,
        lectureType: l.lectureType,
        startTime: l.startTime,
        endTime: l.endTime,
        status: l.status,
        timestamp: Date.now()
      }));

    const finalLogs = [...cleanLogs, ...markedPastLogs];
    onSave(finalLogs);
    onClose();
  };

  // --- Spreadsheet Upload Mode Actions ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
        processUploadedFile(file);
      } else {
        setUploadErrors(["Unsupported file type. Please upload a .xlsx, .xls, or .csv spreadsheet."]);
      }
    }
  };

  const handleFileBrowse = (e) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file) => {
    setUploadErrors([]);
    setUploadedData([]);
    setUploadProgress(0);
    setParsedFile({ name: file.name, size: file.size });

    // Progress simulation
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 80);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target.result;
      const result = await parseExcelAttendance(buffer);

      setTimeout(() => {
        setUploadProgress(null);
        if (result.errors && result.errors.length > 0) {
          setUploadErrors(result.errors);
          setParsedFile(null);
        } else {
          setUploadedData(result.data || []);
        }
      }, 400);
    };

    reader.readAsArrayBuffer(file);
  };

  const clearUploadedFile = () => {
    setParsedFile(null);
    setUploadedData([]);
    setUploadErrors([]);
  };

  const saveUploadedAttendance = () => {
    if (uploadedData.length === 0) return;

    // Merge uploaded data with existing logs, replacing conflicts (same date, subject, start time)
    const currentLogs = [...(attendanceLogs || [])];
    const updatedLogs = currentLogs.filter(log => {
      // Keep only logs that DO NOT overlap with newly uploaded entries
      return !uploadedData.some(
        up => up.date === log.date && 
              up.subjectName?.toLowerCase() === log.subjectName?.toLowerCase() && 
              up.startTime === log.startTime
      );
    });

    // Format final log model
    const newLogs = uploadedData.map(up => ({
      id: `${up.date}-${up.subjectName}-${up.startTime}`,
      date: up.date,
      subjectName: up.subjectName,
      lectureType: up.lectureType,
      startTime: up.startTime,
      endTime: up.endTime,
      status: up.status,
      timestamp: Date.now()
    }));

    onSave([...updatedLogs, ...newLogs]);
    onClose();
  };

  // Manual Tab Metrics
  const totalImportCount = pastLectures.length;
  const importedCount = pastLectures.filter(l => l.status !== null).length;
  const importProgressPercent = totalImportCount > 0 ? Math.round((importedCount / totalImportCount) * 100) : 0;
  
  const presentImportCount = pastLectures.filter(l => l.status === "Present").length;
  const absentImportCount = pastLectures.filter(l => l.status === "Absent").length;
  const totalConductedImport = presentImportCount + absentImportCount;
  const liveImportPercent = totalConductedImport > 0 ? Math.round((presentImportCount / totalConductedImport) * 100) : 0;

  const activeImportDayLectures = pastLectures.filter(l => l.date === activeImportDate);

  // Upload Tab Metrics
  const uploadedPresentCount = uploadedData.filter(l => l.status === "Present").length;
  const uploadedAbsentCount = uploadedData.filter(l => l.status === "Absent").length;
  const uploadedCancelledCount = uploadedData.filter(l => l.status === "Cancelled").length;
  const uploadedHolidayCount = uploadedData.filter(l => l.status === "Holiday").length;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 shadow-xl rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4.5 h-4.5 text-primary shrink-0" />
            <span className="text-sm font-semibold text-slate-800 tracking-tight">
              Import Past Attendance Data
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls Selector */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex select-none">
          <div className="flex border border-slate-200 rounded-md p-0.5 bg-slate-50 w-full">
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={cn(
                "flex-1 h-8 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                activeTab === "manual" ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar Navigation</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={cn(
                "flex-1 h-8 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                activeTab === "upload" ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Spreadsheet Upload</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: MANUAL CALENDAR SELECTOR */}
          {activeTab === "manual" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              <p className="text-xs text-slate-500 leading-relaxed">
                Configure your attendance history for all classes that took place since your semester started on <strong>{startDateStr}</strong> until yesterday.
              </p>

              {/* Progress Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border border-slate-100 bg-slate-50/40 shadow-none">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completion</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {importedCount} / {totalImportCount} ({importProgressPercent}%)
                      </span>
                    </div>
                    <Progress value={importProgressPercent} className="h-1.5" />
                  </CardContent>
                </Card>

                <Card className="border border-slate-100 bg-slate-50/40 shadow-none">
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Live Attendance Rate</span>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-xl font-bold text-slate-800 tracking-tight">
                        {totalConductedImport > 0 ? `${liveImportPercent}%` : "--"}
                      </span>
                      {totalConductedImport > 0 && (
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                          (P: {presentImportCount} • A: {absentImportCount})
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                  {/* Date Stepper */}
                  <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-lg shadow-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevImportDay}
                      disabled={currentImportDateIndex <= 0}
                      className="h-8 w-8 p-0 shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {/* Custom Popover Date Picker */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className="flex items-center gap-2 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white transition-all cursor-pointer select-none font-bold text-xs text-slate-700 shadow-sm outline-none"
                      >
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {new Date(activeImportDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </button>

                      {isCalendarOpen && (
                        <>
                          {/* Invisible overlay to close calendar on clicking outside */}
                          <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            onClick={() => setIsCalendarOpen(false)} 
                          />
                          
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                            {/* Month/Year Header */}
                            <div className="flex items-center justify-between mb-3 select-none">
                              <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-xs font-bold text-slate-800">
                                {calendarMonthName} {calendarYear}
                              </span>
                              <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Weekday Names Header */}
                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-1.5 select-none">
                              <span>Su</span>
                              <span>Mo</span>
                              <span>Tu</span>
                              <span>We</span>
                              <span>Th</span>
                              <span>Fr</span>
                              <span>Sa</span>
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-1">
                              {getDaysInMonth(calendarYear, calendarMonth).map((day, idx) => {
                                const isAllowed = day.dateStr && isDateInAllowedRange(day.dateStr);
                                const isSelected = day.dateStr && day.dateStr === activeImportDate;
                                const completion = day.dateStr ? getCompletionForDate(day.dateStr) : "none";

                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    disabled={!isAllowed}
                                    onClick={() => {
                                      if (day.dateStr) {
                                        setActiveImportDate(day.dateStr);
                                        setIsCalendarOpen(false);
                                      }
                                    }}
                                    className={cn(
                                      "h-8 flex flex-col items-center justify-between p-1 rounded text-[11px] font-semibold transition-all relative cursor-pointer",
                                      day.isCurrentMonth
                                        ? isAllowed
                                          ? isSelected
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-slate-700 hover:bg-slate-100"
                                          : "text-slate-300 pointer-events-none"
                                        : "text-slate-200 pointer-events-none"
                                    )}
                                  >
                                    <span>{day.dayNum}</span>
                                    {/* Completion Dot */}
                                    {isAllowed && completion !== "none" && (
                                      <span className={cn(
                                        "w-1 h-1 rounded-full",
                                        isSelected ? "bg-white" : "",
                                        !isSelected && completion === "complete" && "bg-emerald-500",
                                        !isSelected && completion === "partial" && "bg-amber-400",
                                        !isSelected && completion === "unmarked" && "bg-slate-300"
                                      )} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Calendar Legend */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-medium select-none">
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Marked</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>Partial</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span>Unmarked</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleNextImportDay}
                      disabled={currentImportDateIndex >= uniqueImportDates.length - 1}
                      className="h-8 w-8 p-0 shrink-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>                  {/* Bulk Select controls */}
                  {activeImportDayLectures.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-bold border-emerald-100 text-emerald-600 bg-emerald-50/10 hover:bg-emerald-50"
                        onClick={() => bulkSetPastStatusForDay("Present")}
                      >
                        All Present
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-bold border-rose-100 text-rose-600 bg-rose-50/10 hover:bg-rose-50"
                        onClick={() => bulkSetPastStatusForDay("Absent")}
                      >
                        All Absent
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-bold border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100"
                        onClick={() => bulkSetPastStatusForDay("Holiday")}
                      >
                        Mark Holiday
                      </Button>
                    </div>
                  )}

                  {/* Lectures list */}
                  {activeImportDayLectures.length > 0 ? (
                    <div className="space-y-3">
                      {activeImportDayLectures.map((lec, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "p-4 border border-slate-200/80 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-100",
                            lec.status === "Present" && "border-emerald-200 bg-emerald-50/[0.01]",
                            lec.status === "Absent" && "border-rose-200 bg-rose-50/[0.01]",
                            lec.status === "Cancelled" && "border-amber-200 bg-amber-50/[0.01]"
                          )}
                        >
                          <div className="space-y-1">
                            <h5 className="text-sm font-semibold text-slate-800 tracking-tight leading-none">
                              {lec.subjectName}
                            </h5>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold leading-none">
                              <span className="uppercase">{lec.lectureType}</span>
                              <span>•</span>
                              <span>{lec.startTime} - {lec.endTime}</span>
                            </div>
                          </div>

                          <div className="flex border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0 select-none">
                            {[
                              { label: "P", value: "Present", color: "bg-emerald-600 text-white" },
                              { label: "A", value: "Absent", color: "bg-rose-600 text-white" },
                              { label: "C", value: "Cancelled", color: "bg-amber-600 text-white" },
                              { label: "H", value: "Holiday", color: "bg-slate-600 text-white" },
                            ].map(btn => (
                              <button
                                key={btn.value}
                                type="button"
                                onClick={() => setPastLectureStatus(lec, btn.value)}
                                className={cn(
                                  "w-7 h-6 flex items-center justify-center text-[10px] font-bold rounded cursor-pointer transition-colors",
                                  lec.status === btn.value
                                    ? btn.color
                                    : "text-slate-500 hover:text-slate-800"
                                )}
                                title={btn.value}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-slate-200 bg-white text-slate-400 text-xs rounded-lg text-center cursor-default">
                      No classes scheduled in your timetable for {activeImportDate ? new Date(activeImportDate).toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' }) : "this date"}.
                    </div>
                  )}
                </div>
            </div>
          )}

          {/* TAB 2: SPREADSHEET UPLOAD */}
          {activeTab === "upload" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your class log history (.xlsx, .xls, .csv). The spreadsheet should contain columns for <strong>Date</strong>, <strong>Subject</strong>, and <strong>Status</strong>.
              </p>

              {/* Upload Dropzone */}
              {!parsedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 select-none flex flex-col items-center justify-center space-y-3",
                    isDragActive 
                      ? "border-primary bg-primary/5 scale-[0.99]" 
                      : "border-slate-200/80 bg-slate-50/20 hover:border-slate-300 hover:bg-slate-50/40"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileBrowse}
                    className="hidden"
                  />
                  <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-slate-700">Upload Attendance Spreadsheet</h4>
                    <p className="text-[10px] text-slate-400">Excel (.xlsx, .xls) or CSV up to 10MB</p>
                  </div>
                </div>
              ) : (
                /* File Processing Indicator / Summary */
                <Card className="border border-slate-200/80 bg-white shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-800 truncate">
                            {parsedFile.name}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {Math.round(parsedFile.size / 1024)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearUploadedFile}
                        className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {uploadProgress !== null && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>Processing spreadsheet rows...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-1.5" />
                      </div>
                    )}

                    {uploadedData.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Successfully parsed <strong>{uploadedData.length}</strong> class logs!</span>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 rounded-lg p-2.5">
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase">Present</span>
                            <span className="text-xs font-bold text-emerald-600">{uploadedPresentCount}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase">Absent</span>
                            <span className="text-xs font-bold text-rose-600">{uploadedAbsentCount}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase">Cancelled</span>
                            <span className="text-xs font-bold text-amber-600">{uploadedCancelledCount}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase">Holiday</span>
                            <span className="text-xs font-bold text-slate-600">{uploadedHolidayCount}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Errors rendering */}
              {uploadErrors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg space-y-2 text-xs text-rose-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Spreadsheet Validation Errors:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[10px] text-rose-700 max-h-36 overflow-y-auto font-mono">
                    {uploadErrors.slice(0, 10).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {uploadErrors.length > 10 && (
                      <li>...and {uploadErrors.length - 10} more errors.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Live Preview List of Parsed Rows */}
              {uploadedData.length > 0 && (
                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Logs Review List
                  </span>
                  <div className="border border-slate-200/80 rounded-lg overflow-hidden max-h-48 overflow-y-auto bg-white">
                    <table className="w-full text-xs text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="p-2 w-24">Date</th>
                          <th className="p-2">Subject</th>
                          <th className="p-2 w-16 text-center">Type</th>
                          <th className="p-2 w-20 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedData.slice(0, 30).map((log, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                            <td className="p-2 text-[10px] font-mono text-slate-500">{log.date}</td>
                            <td className="p-2 font-medium text-slate-700 truncate">{log.subjectName}</td>
                            <td className="p-2 text-center text-[10px] text-slate-400">{log.lectureType}</td>
                            <td className="p-2 text-center select-none">
                              <span className={cn(
                                "inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full border",
                                log.status === "Present" && "bg-emerald-50 border-emerald-100 text-emerald-700",
                                log.status === "Absent" && "bg-rose-50 border-rose-100 text-rose-700",
                                log.status === "Cancelled" && "bg-amber-50 border-amber-100 text-amber-700",
                                log.status === "Holiday" && "bg-slate-50 border-slate-200 text-slate-600"
                              )}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {uploadedData.length > 30 && (
                      <div className="p-2 text-center bg-slate-50 text-[10px] text-slate-400 border-t border-slate-100 font-medium">
                        Showing first 30 of {uploadedData.length} records.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="h-16 border-t border-slate-100 flex items-center justify-end px-6 gap-2 bg-slate-50/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          
          {activeTab === "manual" ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={saveManualImportedAttendance}
              disabled={pastLectures.length === 0}
            >
              Save History
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={saveUploadedAttendance}
              disabled={uploadedData.length === 0}
            >
              Merge & Import History
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
