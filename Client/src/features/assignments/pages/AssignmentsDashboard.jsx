import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  CloudLightning,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  AlertTriangle,
  Bookmark,
  TrendingUp,
  Inbox,
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  FileSpreadsheet
} from "lucide-react";
import { CreateAssignmentModal } from "../components/CreateAssignmentModal.jsx";
import { GoogleClassroomConnectModal } from "../components/GoogleClassroomConnectModal.jsx";
import { AssignmentDetailsModal } from "../components/AssignmentDetailsModal.jsx";
import { Button } from "../../../shared/components/Button";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";

export function AssignmentsDashboard() {
  const { setupData } = useAcademicData();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all"); // "all" | "today" | "tomorrow" | "this_week" | "upcoming" | "completed" | "overdue"
  const [subjectFilter, setSubjectFilter] = useState("all"); // subjectId or "all"
  const [priorityFilter, setPriorityFilter] = useState("all"); // "all" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const userId = localStorage.getItem("userId") || "default-user";

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/v1/assignments?userId=${userId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAssignments(data.data);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSyncClassroom = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`http://localhost:5001/api/v1/assignments/sync?userId=${userId}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        await fetchAssignments();
        // Trigger Sidebar update
        window.dispatchEvent(new Event("assignments-updated"));
      } else {
        alert(data.message || "Classroom sync failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error syncing Classroom coursework.");
    } finally {
      setSyncing(false);
    }
  };

  // Header quick statistics
  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === "COMPLETED" || a.status === "SUBMITTED").length;
    const pending = assignments.filter((a) => a.status === "PENDING" || a.status === "IN_PROGRESS").length;
    
    // Calculate actual overdue based on dates
    const today = new Date();
    today.setHours(0,0,0,0);
    const overdue = assignments.filter((a) => {
      if (a.status === "COMPLETED" || a.status === "SUBMITTED" || a.status === "DELETED") return false;
      if (!a.dueDate) return false;
      return new Date(a.dueDate) < today;
    }).length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, overdue, rate };
  }, [assignments]);

  // Filters logic
  const filteredAssignments = useMemo(() => {
    return assignments.filter((ass) => {
      // 1. Search Term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const titleMatch = ass.title?.toLowerCase().includes(term);
        const descMatch = ass.description?.toLowerCase().includes(term);
        const noteMatch = ass.notes?.toLowerCase().includes(term);
        const subjectMatch = ass.subject?.name?.toLowerCase().includes(term);
        if (!titleMatch && !descMatch && !noteMatch && !subjectMatch) return false;
      }

      // 2. Subject Filter
      if (subjectFilter !== "all" && ass.subjectId !== subjectFilter) {
        return false;
      }

      // 3. Priority Filter
      if (priorityFilter !== "all" && ass.priority !== priorityFilter) {
        return false;
      }

      // 4. Time Filter
      if (timeFilter !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));

        const dueDateObj = ass.dueDate ? new Date(ass.dueDate) : null;

        if (timeFilter === "completed") {
          return ass.status === "COMPLETED" || ass.status === "SUBMITTED";
        }

        const isDone = ass.status === "COMPLETED" || ass.status === "SUBMITTED";

        if (timeFilter === "overdue") {
          if (isDone || !dueDateObj) return false;
          return dueDateObj < today;
        }

        if (!dueDateObj) return false;

        if (timeFilter === "today") {
          return dueDateObj.getTime() === today.getTime();
        }
        if (timeFilter === "tomorrow") {
          return dueDateObj.getTime() === tomorrow.getTime();
        }
        if (timeFilter === "this_week") {
          return dueDateObj >= today && dueDateObj <= endOfWeek;
        }
        if (timeFilter === "upcoming") {
          return dueDateObj > today;
        }
      }

      return true;
    });
  }, [assignments, searchTerm, timeFilter, subjectFilter, priorityFilter]);

  // Export handlers
  const handleExportCSV = () => {
    let csv = "Assignment Name,Course Subject,Source,Due Date,Due Time,Marks,Priority,Status\n";
    filteredAssignments.forEach((a) => {
      const date = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "N/A";
      csv += `"${a.title}","${a.subject?.name || "N/A"}",${a.source},${date},${a.dueTime || "N/A"},${a.maxMarks || "N/A"},${a.priority},${a.status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sempilot_assignments_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredAssignments, null, 2));
    const link = document.createElement("a");
    link.href = dataStr;
    link.download = `sempilot_assignments_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  // Get Priority Tag styling
  const getPriorityStyle = (p) => {
    switch (p) {
      case "URGENT": return "text-red-700 bg-red-50 border border-red-150";
      case "HIGH": return "text-orange-700 bg-orange-50 border border-orange-150";
      case "LOW": return "text-slate-600 bg-slate-50 border border-slate-150";
      default: return "text-blue-700 bg-blue-50 border border-blue-150"; // Medium
    }
  };

  // Status Badge styles
  const getStatusStyle = (status, dueDate) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const isOverdue = dueDate && new Date(dueDate) < today && status !== "COMPLETED" && status !== "SUBMITTED";

    if (isOverdue) return "bg-rose-50 text-rose-700 border border-rose-100";

    switch (status) {
      case "COMPLETED":
      case "SUBMITTED":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "IN_PROGRESS":
        return "bg-indigo-50 text-indigo-700 border border-indigo-100";
      case "MISSED":
        return "bg-red-50 text-red-700 border border-red-100";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200"; // Pending
    }
  };

  return (
    <div className="space-y-6 text-left font-sans select-none max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Assignments Registry</h1>
          <p className="text-xs text-slate-500 mt-1">Unified coursework planner for Google Classroom syncs and manual study tasks.</p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncClassroom}
            disabled={syncing}
            className="flex items-center gap-1.5 justify-center flex-1 sm:flex-initial"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${syncing ? "animate-spin" : ""}`} />
            Sync Classroom
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConnectOpen(true)}
            className="flex items-center gap-1.5 justify-center flex-1 sm:flex-initial"
          >
            <CloudLightning className="w-4 h-4 text-indigo-500" />
            Classroom Links
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 justify-center flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Header Quick Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Assignments</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-800">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-400">spanned</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-emerald-600">{stats.completed}</span>
            <span className="text-xs font-semibold text-slate-400">({stats.rate}% rate)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Tasks</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-700">{stats.pending}</span>
            <span className="text-xs font-semibold text-slate-400">active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Registry</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-rose-500">{stats.overdue}</span>
            <span className="text-xs font-semibold text-slate-400">critical</span>
          </div>
        </div>
      </div>

      {/* Filters & search layout card */}
      <div className="bg-white border border-slate-100 p-4.5 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, instructions, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none focus:border-primary font-medium"
            />
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Due Today</option>
              <option value="tomorrow">Due Tomorrow</option>
              <option value="this_week">Due This Week</option>
              <option value="upcoming">Upcoming Future</option>
              <option value="overdue">Overdue Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div className="shrink-0">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium cursor-pointer"
            >
              <option value="all">All Courses</option>
              {setupData?.subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="shrink-0">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Exports toolbar */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-50 select-none text-[10px] text-slate-400 font-bold uppercase">
          <span>Found {filteredAssignments.length} Assignments</span>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded text-[10px] font-bold text-slate-600 transition flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded text-[10px] font-bold text-slate-600 transition flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> JSON
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Resolving assignments...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-16 text-center max-w-xl mx-auto shadow-sm space-y-4 select-none">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">No Assignments Found</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              No coursework matches the active search term or filter rules. Try syncing with Classroom or create manual reminders.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((ass) => {
            const hasDue = !!ass.dueDate;
            const dueStr = hasDue ? new Date(ass.dueDate).toLocaleDateString() : "N/A";
            const dateObj = hasDue ? new Date(ass.dueDate) : null;
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const isCompleted = ass.status === "COMPLETED" || ass.status === "SUBMITTED";
            const isOverdue = dateObj && dateObj < today && !isCompleted;

            return (
              <div
                key={ass.id}
                onClick={() => setSelectedAssignment(ass)}
                className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm"
              >
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {ass.subject?.name || "General Course"}
                    </span>
                    {/* Source Icon Badge */}
                    <span
                      className={`text-[8px] font-extrabold border px-1.5 py-0.2 rounded flex items-center gap-1 uppercase select-none ${
                        ass.source === "GOOGLE"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                          : "text-blue-700 bg-blue-50 border-blue-100"
                      }`}
                    >
                      {ass.source === "GOOGLE" ? (
                        <CloudLightning className="w-2.5 h-2.5" />
                      ) : (
                        <CheckSquare className="w-2.5 h-2.5" />
                      )}
                      {ass.source}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                    {ass.title}
                  </h3>
                </div>

                {/* Subtitle details */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase select-none border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dueStr} {ass.dueTime ? `@ ${ass.dueTime}` : ""}</span>
                  </div>

                  {ass.maxMarks !== null && (
                    <span>{ass.maxMarks} pts</span>
                  )}
                </div>

                {/* Bottom Tags (Priority & Status) */}
                <div className="flex justify-between items-center select-none pt-1">
                  <span className={`text-[8px] font-extrabold border px-2 py-0.5 rounded ${getPriorityStyle(ass.priority)}`}>
                    {ass.priority}
                  </span>

                  <span
                    className={`text-[8px] font-extrabold px-2 py-0.5 rounded uppercase ${getStatusStyle(
                      ass.status,
                      ass.dueDate
                    )}`}
                  >
                    {isOverdue ? "OVERDUE" : ass.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Controllers */}
      <CreateAssignmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onAssignmentCreated={fetchAssignments}
      />

      <GoogleClassroomConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        onSyncComplete={fetchAssignments}
      />

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
