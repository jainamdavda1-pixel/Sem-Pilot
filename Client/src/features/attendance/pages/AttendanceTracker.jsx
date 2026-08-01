import React, { useState, useEffect } from "react";
import { 
  Download, 
  Trash2, 
  Sparkles, 
  History, 
  FileSpreadsheet, 
  BookOpen, 
  HelpCircle,
  CheckCircle2
} from "lucide-react";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { Card, CardContent } from "../../../shared/components/Card";
import { Button } from "../../../shared/components/Button";
import { HistoryFilters } from "../components/HistoryFilters";
import { HistoryTable } from "../components/HistoryTable";
import { calculateAttendanceStats } from "../utils/attendanceUtils";
import { cn, syncAttendanceToBackend } from "../../../shared/utils/utils";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";

export default function AttendanceTracker() {
  const { setupData, attendanceLogs: logs, loading, refreshData } = useAcademicData();

  // Filter States
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const [toastMessage, setToastMessage] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const saveLogs = (newLogs) => {
    syncAttendanceToBackend(newLogs).then(() => refreshData());
  };

  // Status updates handler
  const handleUpdateStatus = (logId, newStatus) => {
    const updated = logs.map((l) => {
      if (l.id === logId) {
        return { ...l, status: newStatus, timestamp: Date.now() };
      }
      return l;
    });
    saveLogs(updated);

    const match = logs.find(l => l.id === logId);
    setToastMessage(`Updated ${match?.subjectName} to ${newStatus}`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Delete handler
  const handleDeleteLog = (logId) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      const updated = logs.filter((l) => l.id !== logId);
      saveLogs(updated);
      setToastMessage("Deleted attendance record");
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const handleResetFilters = () => {
    setSelectedSubject("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedMonth("all");
  };

  // Filter and Sort Logs
  const filteredLogs = (logs || [])
    .filter((log) => {
      const matchSubject = selectedSubject === "all" || log.subjectName === selectedSubject;
      const matchType = selectedType === "all" || log.lectureType === selectedType;
      const matchStatus = selectedStatus === "all" || log.status === selectedStatus;
      
      // Extract month e.g. "2026-07-29" -> month is parts[1] which is "07"
      const parts = log.date ? log.date.split("-") : [];
      const matchMonth = selectedMonth === "all" || (parts.length > 1 && parts[1] === selectedMonth);

      return matchSubject && matchType && matchStatus && matchMonth;
    })
    // Sort by Date descending, then Start Time descending (latest first)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.startTime || "").localeCompare(a.startTime || ""));

  const subjects = setupData?.subjects || [];
  const target = setupData?.semesterInfo?.attendanceRequirement || 75;
  const calculated = calculateAttendanceStats(logs || [], subjects, target);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <SectionHeader
        title="Attendance Records & Logs"
        description="Filter and review historical class logs. Modifying logs updates dashboard progress metrics instantly."
      />

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200/60 bg-white">
          <CardContent className="p-4 text-left select-none space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</span>
            <div className="text-xl font-bold text-slate-800">{calculated.overallPercentage}%</div>
            <p className="text-[10px] text-slate-400 font-medium">Goal: {target}% Target</p>
          </CardContent>
        </Card>
        
        <Card className="border border-slate-200/60 bg-white">
          <CardContent className="p-4 text-left select-none space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Conducted Sessions</span>
            <div className="text-xl font-bold text-slate-800">{logs.length} lectures</div>
            <p className="text-[10px] text-slate-400 font-medium">
              Present: {calculated.overallAttended} • Absent: {logs.length - calculated.overallAttended}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 bg-white">
          <CardContent className="p-4 text-left select-none space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Health</span>
            <div className="text-xl font-bold text-slate-800">
              {subjects.length - calculated.subjectsBelowTarget.length} / {subjects.length}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Subjects above requirement</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Row */}
      <HistoryFilters
        subjects={subjects}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        onResetFilters={handleResetFilters}
      />

      {/* Logs Table */}
      <HistoryTable
        logs={filteredLogs}
        onUpdateStatus={handleUpdateStatus}
        onDeleteLog={handleDeleteLog}
      />

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 shadow-md rounded-lg p-3 px-4 flex items-center gap-2.5 z-50 text-white text-xs font-medium animate-in fade-in slide-in-from-bottom-4 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

