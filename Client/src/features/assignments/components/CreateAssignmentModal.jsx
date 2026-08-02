import React, { useState } from "react";
import { X, Calendar, Clock, BookOpen, AlertCircle, Check, Loader2 } from "lucide-react";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";

export function CreateAssignmentModal({ isOpen, onClose, onAssignmentCreated }) {
  const { setupData } = useAcademicData();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const userObj = JSON.parse(localStorage.getItem("sempilot_user") || "null");
  const userId = userObj?.id || "default-user";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !subjectId) {
      setErrorMessage("Please complete all required fields (*).");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const res = await fetch(`${API_BASE}/api/v1/assignments?userId=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          subjectId,
          dueDate: dueDate || null,
          dueTime: dueTime || null,
          maxMarks: maxMarks ? parseFloat(maxMarks) : null,
          priority,
          notes: notes || null,
          attachments: attachments || null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Reset states
        setTitle("");
        setDescription("");
        setSubjectId("");
        setDueDate("");
        setDueTime("");
        setMaxMarks("");
        setPriority("MEDIUM");
        setNotes("");
        setAttachments("");

        onAssignmentCreated?.();
        // Dispatch sidebar counts update event
        window.dispatchEvent(new Event("assignments-updated"));
        onClose();
      } else {
        throw new Error(data.message || "Failed to create assignment.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred creating the assignment.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans text-left">
      <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 select-none">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-slate-800">Add Manual Assignment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HW 3: Data Structures Lab"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Instructions / Description
            </label>
            <textarea
              placeholder="Provide assignment specifications..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Subject Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Course Subject *
              </label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium"
              >
                <option value="">-- Select Subject --</option>
                {setupData?.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Priority Index
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Due Date */}
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-primary font-medium"
              />
            </div>

            {/* Due Time */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-primary font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Max Marks */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Maximum Score / Marks
              </label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium"
              />
            </div>

            {/* Attachments (URLs) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Attachment URL Links
              </label>
              <input
                type="text"
                placeholder="Comma separated links..."
                value={attachments}
                onChange={(e) => setAttachments(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Personal Study Notes
            </label>
            <textarea
              placeholder="Jot down notes, checklists, or comments..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary font-medium resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5 select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}{" "}
              Create Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
