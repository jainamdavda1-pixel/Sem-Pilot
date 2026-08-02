import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  ExternalLink,
  Save,
  Trash2,
  CheckCircle,
  FileText,
  AlertTriangle,
  Loader2
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

export function AssignmentDetailsModal({ isOpen, onClose, assignment, onUpdate, onDelete }) {
  const [status, setStatus] = useState("PENDING");
  const [priority, setPriority] = useState("MEDIUM");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (assignment) {
      setStatus(assignment.status || "PENDING");
      setPriority(assignment.priority || "MEDIUM");
      setNotes(assignment.notes || "");
    }
  }, [assignment]);

  if (!isOpen || !assignment) return null;

  // Calculate due date countdown
  const getCountdownText = () => {
    if (!assignment.dueDate) return "No due date";
    const dueTime = new Date(assignment.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const msDiff = dueTime.getTime() - today.getTime();
    const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return "⚠️ Due today!";
    if (daysDiff === 1) return "⏳ Due tomorrow!";
    if (daysDiff > 1) return `Due in ${daysDiff} days`;
    return `🚨 Overdue by ${Math.abs(daysDiff)} days`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/assignments/${assignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority, notes })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onUpdate?.();
        // Dispatch sidebar counts update event
        window.dispatchEvent(new Event("assignments-updated"));
        onClose();
      } else {
        throw new Error(data.message || "Failed to update assignment.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error updating assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmationMsg =
      assignment.source === "GOOGLE"
        ? "Hide this Google Classroom assignment from your SemPilot list?"
        : "Delete this manual assignment permanently?";

    if (!window.confirm(confirmationMsg)) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/assignments/${assignment.id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onDelete?.();
        // Dispatch sidebar counts update event
        window.dispatchEvent(new Event("assignments-updated"));
        onClose();
      } else {
        throw new Error(data.message || "Failed to delete assignment.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting assignment.");
    } finally {
      setDeleting(false);
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case "URGENT": return "bg-red-50 text-red-700 border-red-200";
      case "HIGH": return "bg-orange-50 text-orange-700 border-orange-200";
      case "LOW": return "bg-slate-50 text-slate-600 border-slate-200";
      default: return "bg-blue-50 text-blue-700 border-blue-200"; // Medium
    }
  };

  const getSourceIconColor = (src) => {
    return src === "GOOGLE" ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-blue-600 bg-blue-50 border-blue-100";
  };

  // Attachments parsing
  const attachmentsList = assignment.attachments
    ? assignment.attachments.split(",").map(url => url.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans text-left">
      <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 select-none">
            <span className={`text-[9px] font-bold border rounded px-1.5 py-0.5 ${getSourceIconColor(assignment.source)}`}>
              {assignment.source}
            </span>
            <span className={`text-[9px] font-bold border rounded px-1.5 py-0.5 ${getPriorityColor(assignment.priority)}`}>
              {assignment.priority}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {assignment.subject?.name || "Subject Course"}
            </span>
            <h2 className="text-base font-bold text-slate-800 leading-tight">
              {assignment.title}
            </h2>
          </div>

          {/* Date and Countdown Block */}
          <div className="grid grid-cols-2 gap-4 py-3.5 border-y border-slate-50 select-none">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <Calendar className="w-4 h-4 text-slate-400" /> Due Date
              </div>
              <p className="text-xs font-bold text-slate-700">
                {assignment.dueDate
                  ? new Date(assignment.dueDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })
                  : "No Due Date"}{" "}
                {assignment.dueTime ? `at ${assignment.dueTime}` : ""}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Time Remaining
              </span>
              <span className="text-xs font-bold text-slate-800 block">
                {getCountdownText()}
              </span>
            </div>
          </div>

          {/* Description */}
          {assignment.description && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Instructions
              </span>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/55 p-3 rounded-lg border border-slate-100">
                {assignment.description}
              </p>
            </div>
          )}

          {/* Marks */}
          {assignment.maxMarks !== null && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Maximum Score
              </span>
              <p className="text-xs font-bold text-slate-700">
                {assignment.maxMarks} Points / Marks
              </p>
            </div>
          )}

          {/* Attachments */}
          {attachmentsList.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Resources & Attachments
              </span>
              <div className="space-y-1.5">
                {attachmentsList.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-between text-xs text-primary font-medium hover:border-slate-300"
                  >
                    <span className="truncate max-w-[280px]">{url}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Local Status Control */}
          <div className="grid grid-cols-2 gap-4 select-none">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Status Settings
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-primary font-semibold"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="COMPLETED">Completed</option>
                <option value="MISSED">Missed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Priority Index
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-primary font-semibold"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Study Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Personal Study Notes
            </label>
            <textarea
              placeholder="Add checklists, notes, reminders, or formulas..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium resize-none"
            />
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl shrink-0 flex justify-between gap-3 select-none">
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            Delete
          </button>

          <button
            onClick={handleSave}
            disabled={saving || deleting}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}{" "}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
