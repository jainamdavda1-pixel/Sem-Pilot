import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Check, 
  X, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  BookmarkCheck,
  CalendarDays,
  CalendarRange
} from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Card, CardContent } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { Progress } from "../../../shared/components/Progress";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { calculateAttendanceStats } from "../../attendance/utils/attendanceUtils";
import { ImportPastAttendanceModal } from "../components/ImportPastAttendanceModal";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";
import { cn, syncAttendanceToBackend } from "../../../shared/utils/utils";

export default function TodayAttendance() {
  const navigate = useNavigate();

  const { setupData, attendanceLogs, loading, refreshData } = useAcademicData();
  const [markedToday, setMarkedToday] = useState({}); 
  const [showSuccess, setShowSuccess] = useState(false);

  // Previous Attendance Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const todayDateString = new Date().toISOString().split("T")[0];
  const weekdayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  useEffect(() => {
    if (attendanceLogs) {
      const todayLogs = attendanceLogs.filter(log => log.date === todayDateString);
      const initialMarked = {};
      todayLogs.forEach(log => {
        const key = `${log.subjectName}-${log.startTime}`;
        initialMarked[key] = log.status;
      });
      setMarkedToday(initialMarked);
    }
  }, [attendanceLogs, todayDateString]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!setupData) {
    return (
      <div className="p-12 border border-dashed border-slate-200 bg-white rounded-lg flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto mt-12 shadow-sm text-slate-800 font-sans">
        <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-slate-800 tracking-tight">Onboarding Required</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Please run the import wizard to configure your semester boundary, faculties, subjects, and timetable schedule.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate("/import")}>
          Import Academic Setup
        </Button>
      </div>
    );
  }

  // Get list of all lectures scheduled for today's weekday
  const timetableEntries = setupData.timetableEntries || [];
  const todayLectures = timetableEntries
    .filter(entry => entry.day?.toLowerCase() === weekdayName?.toLowerCase())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Compute stats
  const subjects = setupData.subjects || [];
  const target = setupData.semesterInfo?.attendanceRequirement || 75;
  const stats = calculateAttendanceStats(attendanceLogs, subjects, target);
  
  // Format readable date
  const formattedLongDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Greet user
  const currentHour = new Date().getHours();
  let greeting = "Good Evening";
  if (currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour < 17) {
    greeting = "Good Afternoon";
  }

  // Motivational message
  const overallPercent = stats.overallPercentage || 0;
  let motivationalMessage = "Start the semester strong by marking your attendance today!";
  let motivationalVariant = "info";

  if (attendanceLogs.length > 0) {
    if (overallPercent >= target) {
      motivationalMessage = `✨ Excellent work! Your attendance is at ${overallPercent}%. Keep it up to maintain your safe bunking margins.`;
      motivationalVariant = "success";
    } else {
      motivationalMessage = `⚠️ Attention: Your attendance is currently at ${overallPercent}% (below target ${target}%). Prioritize attending today's lectures.`;
      motivationalVariant = "warning";
    }
  }

  // Mark today's lecture
  const handleMark = (subjectName, startTime, status) => {
    const key = `${subjectName}-${startTime}`;
    setMarkedToday(prev => ({
      ...prev,
      [key]: prev[key] === status ? null : status
    }));
  };

  // Save today's logs
  const handleSaveAttendance = () => {
    const newLogsForToday = [];

    todayLectures.forEach(entry => {
      const key = `${entry.subjectName}-${entry.startTime}`;
      const status = markedToday[key];
      if (status) {
        newLogsForToday.push({
          id: `${todayDateString}-${entry.subjectName}-${entry.startTime}`,
          date: todayDateString,
          subjectName: entry.subjectName,
          lectureType: entry.lectureType,
          startTime: entry.startTime,
          endTime: entry.endTime,
          status: status,
          timestamp: Date.now()
        });
      }
    });

    const otherDaysLogs = attendanceLogs.filter(log => log.date !== todayDateString);
    const updatedLogs = [...otherDaysLogs, ...newLogsForToday];

    syncAttendanceToBackend(updatedLogs).then(() => refreshData());

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 1800);
  };

  const handleImportSave = (updatedLogs) => {
    syncAttendanceToBackend(updatedLogs).then(() => refreshData());
    
    // Update markedToday state for today's logs if backfilled/changed
    const todayLogs = updatedLogs.filter(log => log.date === todayDateString);
    const initialMarked = {};
    todayLogs.forEach(log => {
      const key = `${log.subjectName}-${log.startTime}`;
      initialMarked[key] = log.status;
    });
    setMarkedToday(initialMarked);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 1800);
  };

  const getStrictnessLabel = (level) => {
    switch (level) {
      case "high": return "Strict";
      case "medium": return "Medium";
      case "low": return "Relaxed";
      default: return "Medium";
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "very_high": return "Critical";
      case "high": return "High";
      case "medium": return "Medium";
      case "low": return "Low";
      default: return "Medium";
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] pb-24 text-left">
      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 shadow-xl border border-slate-100 flex flex-col items-center text-center space-y-4 scale-up-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-800">Attendance Saved</h3>
              <p className="text-sm text-slate-500">Your attendance logs have been successfully stored.</p>
            </div>
          </div>
        </div>
      )}

      {/* Import Previous Attendance Modal */}
      <ImportPastAttendanceModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        setupData={setupData}
        attendanceLogs={attendanceLogs}
        onSave={handleImportSave}
      />

      {/* Top Banner Greeting Section */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">{weekdayName}</span>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              {greeting}, Student
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
              <p className="text-xs text-slate-500 font-medium">
                {formattedLongDate}
              </p>
              {setupData.semesterInfo?.semesterStartDate && (
                <>
                  <span className="text-slate-300 select-none hidden sm:inline">•</span>
                  <Button 
                    variant="link" 
                    className="text-xs h-auto p-0 flex items-center gap-1 text-primary hover:underline font-semibold"
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    <CalendarRange className="w-3.5 h-3.5" />
                    <span>Import Past Attendance</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Overall Percentage Progress Ring indicator */}
          <div className="flex items-center gap-4 border-l border-slate-100 pl-0 md:pl-6">
            <div className="text-right">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Rate</span>
              <span className="text-2xl font-bold text-slate-800">{overallPercent}%</span>
            </div>
            <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center bg-slate-50 relative select-none">
              <TrendingUp className={cn(
                "w-5 h-5",
                overallPercent >= target ? "text-emerald-500" : "text-amber-500"
              )} />
            </div>
          </div>
        </div>

        {/* Motivational Notification Box */}
        <div className={cn(
          "mt-6 p-4 rounded-lg border text-sm flex items-start gap-3",
          motivationalVariant === "success" && "border-emerald-100 bg-emerald-50/20 text-emerald-800",
          motivationalVariant === "warning" && "border-amber-100 bg-amber-50/20 text-amber-800",
          motivationalVariant === "info" && "border-blue-100 bg-blue-50/20 text-blue-800"
        )}>
          <span className="shrink-0 text-base leading-none select-none">
            {motivationalVariant === "success" && "✨"}
            {motivationalVariant === "warning" && "⚠️"}
            {motivationalVariant === "info" && "📋"}
          </span>
          <p className="leading-relaxed font-medium">
            {motivationalMessage}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Today's Lectures</h2>
          <span className="text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200/50 rounded-full px-2.5 py-0.5 select-none">
            {todayLectures.length} scheduled
          </span>
        </div>

        {/* Empty State */}
        {todayLectures.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[260px] shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400 select-none">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800">No lectures today</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-normal">Your timetable shows no scheduled classes for {weekdayName}. Enjoy your day!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {todayLectures.map((lecture) => {
              const lectureKey = `${lecture.subjectName}-${lecture.startTime}`;
              const selectedStatus = markedToday[lectureKey];

              // Lookup subject details from configuration
              const subMeta = subjects.find(s => s.name?.toLowerCase() === lecture.subjectName?.toLowerCase()) || {};
              const subStats = stats.subjectStats?.find(s => s.name?.toLowerCase() === lecture.subjectName?.toLowerCase()) || {};
              const subPercentage = subStats.percentage ?? 0;

              return (
                <Card 
                  key={lectureKey}
                  className={cn(
                    "overflow-hidden transition-all duration-200 border-l-4",
                    selectedStatus === "Present" && "border-emerald-500 bg-emerald-50/5 border-slate-200",
                    selectedStatus === "Absent" && "border-rose-500 bg-rose-50/5 border-slate-200",
                    !selectedStatus && "border-slate-300 hover:border-slate-400"
                  )}
                >
                  <CardContent className="p-6 space-y-6">
                    {/* Header: Subject & Time */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 tracking-tight text-base leading-snug">
                            {lecture.subjectName}
                          </h3>
                          <Badge variant={lecture.lectureType === "Theory" ? "default" : "secondary"} className="text-[9px] py-0 px-1.5 shrink-0">
                            {lecture.lectureType}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lecture.facultyName}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-xs font-bold text-slate-800 flex items-center gap-1 justify-end">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lecture.startTime} - {lecture.endTime}</span>
                        </span>
                        {lecture.room && (
                          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                            <span>Room {lecture.room}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Status Metrics Row */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-50/50 border border-slate-100 rounded-lg p-3 select-none text-center">
                      <div className="space-y-0.5 border-r border-slate-200/50">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attendance</span>
                        <span className={cn(
                          "block text-xs font-bold",
                          subPercentage >= target ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {subPercentage}%
                        </span>
                      </div>
                      <div className="space-y-0.5 border-r border-slate-200/50">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Strictness</span>
                        <span className={cn(
                          "block text-xs font-bold capitalize",
                          subMeta.facultyStrictness === "high" && "text-rose-600",
                          subMeta.facultyStrictness === "medium" && "text-amber-600",
                          subMeta.facultyStrictness === "low" && "text-emerald-600"
                        )}>
                          {getStrictnessLabel(subMeta.facultyStrictness)}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
                        <span className={cn(
                          "block text-xs font-bold",
                          subMeta.priority === "very_high" && "text-rose-600",
                          subMeta.priority === "high" && "text-amber-600",
                          subMeta.priority === "medium" && "text-blue-600",
                          subMeta.priority === "low" && "text-slate-500"
                        )}>
                          {getPriorityLabel(subMeta.priority)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={selectedStatus === "Present" ? "primary" : "secondary"}
                        className={cn(
                          "w-full flex items-center justify-center gap-1.5 h-11 border border-slate-200 hover:bg-slate-50/50",
                          selectedStatus === "Present" && "bg-emerald-600 hover:bg-emerald-600/95 text-white border-transparent"
                        )}
                        onClick={() => handleMark(lecture.subjectName, lecture.startTime, "Present")}
                      >
                        <Check className={cn("w-4 h-4 shrink-0", selectedStatus === "Present" ? "stroke-[3]" : "text-slate-400")} />
                        <span>Present</span>
                      </Button>
                      <Button
                        variant={selectedStatus === "Absent" ? "primary" : "secondary"}
                        className={cn(
                          "w-full flex items-center justify-center gap-1.5 h-11 border border-slate-200 hover:bg-slate-50/50",
                          selectedStatus === "Absent" && "bg-rose-600 hover:bg-rose-600/95 text-white border-transparent"
                        )}
                        onClick={() => handleMark(lecture.subjectName, lecture.startTime, "Absent")}
                      >
                        <X className={cn("w-4 h-4 shrink-0", selectedStatus === "Absent" ? "stroke-[3]" : "text-slate-400")} />
                        <span>Absent</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      {todayLectures.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 md:left-64 px-6 md:px-8 z-40 pointer-events-none flex justify-center">
          <div className="bg-white/95 backdrop-blur border border-slate-200/80 shadow-lg rounded-xl p-4 max-w-xl w-full flex items-center justify-between gap-6 pointer-events-auto">
            <div className="space-y-0.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
              <span className="block text-sm font-semibold text-slate-700">
                {Object.values(markedToday).filter(Boolean).length} of {todayLectures.length} marked
              </span>
            </div>
            <Button
              className="px-6 h-11 bg-primary text-white font-semibold flex items-center gap-2 hover:bg-primary/95 shadow-sm active:scale-[0.98]"
              onClick={handleSaveAttendance}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Save Attendance</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
