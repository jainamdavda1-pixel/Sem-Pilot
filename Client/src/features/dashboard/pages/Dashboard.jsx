import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CalendarDays, 
  Calendar, 
  History, 
  CheckSquare, 
  Settings, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  CalendarRange
} from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../shared/components/Card";
import { Progress } from "../../../shared/components/Progress";
import { WelcomeBanner } from "../components/WelcomeBanner";
import { TodaySchedule } from "../components/TodaySchedule";
import { SummaryStats } from "../components/SummaryStats";
import { SubjectTrackers } from "../components/SubjectTrackers";
import { calculateAttendanceStats } from "../../attendance/utils/attendanceUtils";
import { cn, syncAttendanceToBackend } from "../../../shared/utils/utils";
import { ImportPastAttendanceModal } from "../components/ImportPastAttendanceModal";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function Dashboard() {
  const navigate = useNavigate();
  
  const { setupData, setSetupData, attendanceLogs, loading, refreshData } = useAcademicData();
  const [toastMessage, setToastMessage] = useState(null);

  // Quick Action Modals
  const [isMarkDayModalOpen, setIsMarkDayModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const todayDateString = new Date().toISOString().split("T")[0];
  const weekdayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // State for editing semester dates in the Overview sidebar
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'success' | 'error'

  // Keep state synced with setupData changes
  useEffect(() => {
    if (setupData?.semesterInfo) {
      setEditStartDate(setupData.semesterInfo.semesterStartDate || "");
      setEditEndDate(setupData.semesterInfo.semesterEndDate || "");
    }
  }, [setupData]);

  const handleSaveDates = async () => {
    if (!editStartDate || !editEndDate) {
      alert("Both Start Date and End Date are required.");
      return;
    }
    
    if (new Date(editEndDate) < new Date(editStartDate)) {
      alert("Semester End Date must be on or after Start Date.");
      return;
    }

    setSaveStatus("saving");

    try {
      // 1. Update frontend LocalStorage
      const updatedSetup = {
        ...setupData,
        semesterInfo: {
          ...(setupData.semesterInfo || {}),
          semesterStartDate: editStartDate,
          semesterEndDate: editEndDate
        }
      };
      localStorage.setItem("sempilot_setup_data", JSON.stringify(updatedSetup));
      setSetupData(updatedSetup);

      // 2. Update backend database
      const userObj = JSON.parse(localStorage.getItem("sempilot_user") || "null");
      const userId = userObj?.id || "default-user";

      // First, fetch existing semesters to retrieve ID
      const semestersRes = await fetch(`${API_BASE}/api/v1/semesters?userId=${userId}`);
      if (semestersRes.ok) {
        const semestersData = await semestersRes.json();
        const semestersList = semestersData.data || [];
        
        if (semestersList.length > 0) {
          // If semester exists, update it
          const semId = semestersList[0].id;
          await fetch(`${API_BASE}/api/v1/semesters/${semId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              startDate: editStartDate,
              endDate: editEndDate
            })
          });
        } else {
          // If no semester exists, create one
          await fetch(`${API_BASE}/api/v1/semesters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: setupData?.semesterInfo?.semester || "My Semester",
              academicYear: setupData?.semesterInfo?.academicYear || "2026-27",
              startDate: editStartDate,
              endDate: editEndDate,
              attendanceRequirement: setupData?.semesterInfo?.attendanceRequirement || 75,
              userId: userId
            })
          });
        }
      }

      setSaveStatus("success");
      await refreshData();
      setTimeout(() => {
        setSaveStatus(null);
        setIsEditingDates(false);
      }, 1500);

    } catch (err) {
      console.error("Failed to update semester dates in db", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Check if onboarding setup is complete
  const isSetupComplete = localStorage.getItem("sempilot_setup_complete") === "true";

  if (!isSetupComplete || !setupData) {
    return (
      <div className="p-12 border border-dashed border-slate-200 bg-white rounded-lg flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto mt-12 shadow-sm font-sans text-slate-800">
        <AlertCircle className="w-10 h-10 text-amber-500 shrink-0" />
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

  // Perform stats calculations safely
  const subjects = setupData.subjects || [];
  const timetableEntries = setupData.timetableEntries || [];
  const attendanceRequirement = setupData.semesterInfo?.attendanceRequirement || 75;

  const calculated = calculateAttendanceStats(
    attendanceLogs || [],
    subjects,
    attendanceRequirement
  );

  // Today's scheduled classes
  const todayEntries = timetableEntries
    .filter((e) => e.day === weekdayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Today's attendance logs
  const todayLogs = (attendanceLogs || []).filter((l) => l.date === todayDateString);

  // Stats specific to today
  const todayCount = todayEntries.length;
  const todayLoggedCount = todayLogs.length;

  // Find next upcoming lecture today
  const upcomingEntry = todayEntries.find(
    (entry) => !todayLogs.some(
      (log) => log.subjectName?.toLowerCase() === entry.subjectName?.toLowerCase() && 
               log.startTime === entry.startTime
    )
  );

  // Combine overall metrics
  const statsSummary = {
    ...calculated,
    todayCount,
    todayLoggedCount,
  };

  // Trigger Instant Save log handler
  const handleLogAttendance = (entry, status) => {
    const newLog = {
      id: `${todayDateString}-${entry.subjectName}-${entry.startTime}`,
      date: todayDateString,
      subjectName: entry.subjectName,
      lectureType: entry.lectureType,
      startTime: entry.startTime,
      endTime: entry.endTime,
      status: status,
      timestamp: Date.now(),
    };

    const updatedLogs = (attendanceLogs || []).filter(
      (l) => !(l.date === todayDateString && 
               l.subjectName?.toLowerCase() === entry.subjectName?.toLowerCase() && 
               l.startTime === entry.startTime)
    );

    updatedLogs.push(newLog);
    syncAttendanceToBackend(updatedLogs).then(() => refreshData());

    setToastMessage(`Marked ${entry.subjectName} as ${status}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Quick Action: Mark all scheduled classes today in one click
  const handleMarkEntireDay = (status) => {
    if (todayEntries.length === 0) return;

    let updatedLogs = [...(attendanceLogs || [])];

    todayEntries.forEach((entry) => {
      const newLog = {
        id: `${todayDateString}-${entry.subjectName}-${entry.startTime}`,
        date: todayDateString,
        subjectName: entry.subjectName,
        lectureType: entry.lectureType,
        startTime: entry.startTime,
        endTime: entry.endTime,
        status: status,
        timestamp: Date.now(),
      };

      updatedLogs = updatedLogs.filter(
        (l) => !(l.date === todayDateString && 
                 l.subjectName?.toLowerCase() === entry.subjectName?.toLowerCase() && 
                 l.startTime === entry.startTime)
      );

      updatedLogs.push(newLog);
    });

    syncAttendanceToBackend(updatedLogs).then(() => refreshData());
    setIsMarkDayModalOpen(false);

    setToastMessage(`Marked all today's classes as ${status}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Past Attendance actions
  const handleImportSave = (updatedLogs) => {
    syncAttendanceToBackend(updatedLogs).then(() => refreshData());
    
    setToastMessage("Attendance history saved successfully");
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="space-y-8 pb-12 select-none relative text-left animate-in fade-in duration-200">
      
      {/* 1. Welcome Banner */}
      <WelcomeBanner
        greeting={calculated.greeting}
        name="Student"
        stats={{ todayCount }}
        dates={setupData.semesterInfo || {}}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's schedule + Subject Trackers */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Today's Schedule widget */}
          <TodaySchedule
            todayEntries={todayEntries}
            todayLogs={todayLogs}
            subjectStats={calculated.subjectStats}
            target={attendanceRequirement}
            onLogAttendance={handleLogAttendance}
          />

          {/* Subject Master Tracker progress bars */}
          <SubjectTrackers
            subjectStats={calculated.subjectStats}
            target={attendanceRequirement}
          />

          {/* Assignments Planner Widget */}
          <DashboardAssignmentsWidget
            navigate={navigate}
            todayDateString={todayDateString}
            userId={userId}
          />
        </div>

        {/* Right Column: Quick Actions & Overview Cards */}
        <div className="space-y-8">
          
          {/* Performance Overview summary cards */}
          <Card className="border border-slate-200/60 bg-white shadow-sm overflow-hidden select-none">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Overall Attendance</span>
                <span className={cn(
                  "text-sm font-bold",
                  calculated.overallPercentage >= attendanceRequirement ? "text-emerald-600" : "text-amber-600"
                )}>
                  {calculated.overallPercentage}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Conducted Sessions</span>
                <span className="text-sm font-bold text-slate-700">
                  {attendanceLogs.length} classes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Attendance Status</span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/50 px-2 py-0.5 rounded">
                  {calculated.marginText}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <div className="space-y-4 text-left">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              Quick Actions
            </h3>
            <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden select-none">
              <CardContent className="p-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-semibold h-9"
                  onClick={() => setIsImportModalOpen(true)}
                >
                  <CalendarRange className="w-4 h-4 mr-2 text-slate-400" />
                  Import Past Attendance
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-semibold h-9"
                  onClick={() => navigate("/timetable")}
                >
                  <CalendarDays className="w-4 h-4 mr-2 text-slate-400" />
                  View Timetable Grid
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-semibold h-9"
                  onClick={() => navigate("/calendar")}
                >
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  View Academic Calendar
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-semibold h-9"
                  onClick={() => navigate("/attendance")}
                >
                  <History className="w-4 h-4 mr-2 text-slate-400" />
                  Attendance Logs & History
                </Button>

                {todayEntries.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs font-semibold h-9 text-slate-700 border-dashed hover:border-slate-300"
                    onClick={() => setIsMarkDayModalOpen(true)}
                  >
                    <CheckSquare className="w-4 h-4 mr-2 text-slate-400" />
                    Mark Entire Day
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-semibold h-9"
                  onClick={() => navigate("/setup")}
                >
                  <Settings className="w-4 h-4 mr-2 text-slate-400" />
                  Re-run Setup Wizard
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Semester Dates Card */}
          <div className="space-y-4 text-left select-none animate-in fade-in duration-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Semester Term Boundaries
            </h3>
            <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
              <CardContent className="p-4 space-y-4">
                {!isEditingDates ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Start Date</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">
                            {editStartDate ? new Date(editStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not set"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">End Date</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">
                            {editEndDate ? new Date(editEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not set"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold h-8 mt-2"
                      onClick={() => setIsEditingDates(true)}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      Edit Semester Dates
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 text-left">
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block" htmlFor="sidebarStartDate">Start Date</label>
                        <input
                          id="sidebarStartDate"
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block" htmlFor="sidebarEndDate">End Date</label>
                        <input
                          id="sidebarEndDate"
                          type="date"
                          value={editEndDate}
                          onChange={(e) => setEditEndDate(e.target.value)}
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs h-8 text-slate-500 hover:bg-slate-50"
                        onClick={() => {
                          setEditStartDate(setupData?.semesterInfo?.semesterStartDate || "");
                          setEditEndDate(setupData?.semesterInfo?.semesterEndDate || "");
                          setIsEditingDates(false);
                        }}
                        disabled={saveStatus === "saving"}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 text-xs h-8 font-semibold"
                        onClick={handleSaveDates}
                        disabled={saveStatus === "saving"}
                      >
                        {saveStatus === "saving" ? "Saving..." : saveStatus === "success" ? "Saved!" : "Save"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

      </div>

      {/* Instant save Success Toast Overlay */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 shadow-md rounded-lg p-3 px-4 flex items-center gap-2.5 z-50 text-white text-xs font-medium animate-in fade-in slide-in-from-bottom-4 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mark Entire Day Dialog Popup */}
      {isMarkDayModalOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 shadow-md rounded-lg max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block text-left">
                Mark Entire Day
              </span>
              <button
                type="button"
                onClick={() => setIsMarkDayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-left">
              <p className="text-xs text-slate-500 leading-relaxed">
                Log attendance for all {todayEntries.length} classes scheduled for today ({weekdayName}) in a single click.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs"
                  onClick={() => handleMarkEntireDay("Present")}
                >
                  All Present
                </Button>
                <Button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 border-red-600 text-white h-9 text-xs"
                  onClick={() => handleMarkEntireDay("Absent")}
                >
                  All Absent
                </Button>
              </div>
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

    </div>
  );
}

// Assignments Dashboard Widget
function DashboardAssignmentsWidget({ navigate, todayDateString, userId }) {
  const [assignments, setAssignments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/assignments?userId=${userId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAssignments(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
    window.addEventListener("assignments-updated", fetchAssignments);
    return () => window.removeEventListener("assignments-updated", fetchAssignments);
  }, [userId]);

  const stats = React.useMemo(() => {
    const active = assignments.filter((a) => a.status !== "DELETED");
    const completed = active.filter(
      (a) => a.status === "COMPLETED" || a.status === "SUBMITTED"
    );
    const rate = active.length > 0 ? Math.round((completed.length / active.length) * 100) : 100;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const overdue = active.filter((a) => {
      if (a.status === "COMPLETED" || a.status === "SUBMITTED") return false;
      if (!a.dueDate) return false;
      return new Date(a.dueDate) < today;
    });

    const dueToday = active.filter((a) => {
      if (a.status === "COMPLETED" || a.status === "SUBMITTED") return false;
      if (!a.dueDate) return false;
      return a.dueDate.startsWith(todayDateString);
    });

    const dueTomorrow = active.filter((a) => {
      if (a.status === "COMPLETED" || a.status === "SUBMITTED") return false;
      if (!a.dueDate) return false;
      return a.dueDate.startsWith(tomorrowStr);
    });

    return { overdue, dueToday, dueTomorrow, rate };
  }, [assignments, todayDateString]);

  if (loading) {
    return (
      <Card className="border border-slate-200/60 bg-white shadow-sm p-6 text-center">
        <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
      </Card>
    );
  }

  const hasAlerts = stats.overdue.length > 0 || stats.dueToday.length > 0 || stats.dueTomorrow.length > 0;

  return (
    <Card className="border border-slate-200/60 bg-white shadow-sm overflow-hidden text-left">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 flex flex-row justify-between items-center select-none">
        <div>
          <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Academic Coursework Planner
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-400">
            Active Classroom tasks and custom goals.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/assignments")}
          className="h-7 text-[10px] font-bold cursor-pointer"
        >
          Open Planner <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Progress Tracker */}
        <div className="space-y-1.5 select-none">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-500">Coursework Completion Rate</span>
            <span className="font-bold text-slate-800">{stats.rate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>

        {/* Warning Alerts */}
        {stats.overdue.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-semibold flex gap-2 leading-relaxed">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span>You have {stats.overdue.length} overdue assignment(s)!</span>
              <ul className="list-disc pl-4 mt-1 font-medium text-[11px] opacity-90">
                {stats.overdue.map((a) => (
                  <li key={a.id}>{a.title}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Lists display */}
        {!hasAlerts ? (
          <div className="text-center py-6 text-xs text-slate-400 font-medium select-none">
            ✅ No assignments due today or tomorrow. You are fully caught up!
          </div>
        ) : (
          <div className="space-y-3.5">
            {stats.dueToday.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wider select-none w-fit block">
                  Due Today
                </span>
                <div className="space-y-1.5 pl-1.5">
                  {stats.dueToday.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => navigate("/assignments")}
                      className="text-xs font-semibold text-slate-700 hover:text-primary transition flex items-center gap-2 cursor-pointer leading-tight"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="truncate">{a.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium select-none">
                        ({a.subject?.name})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.dueTomorrow.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider select-none w-fit block">
                  Due Tomorrow
                </span>
                <div className="space-y-1.5 pl-1.5">
                  {stats.dueTomorrow.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => navigate("/assignments")}
                      className="text-xs font-semibold text-slate-700 hover:text-primary transition flex items-center gap-2 cursor-pointer leading-tight"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                      <span className="truncate">{a.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium select-none">
                        ({a.subject?.name})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

