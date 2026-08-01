import React, { useState, useEffect } from "react";
import { X, CloudLightning, Loader2, Check, AlertTriangle, LogOut, ArrowRight, RefreshCw } from "lucide-react";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";

export function GoogleClassroomConnectModal({ isOpen, onClose, onSyncComplete }) {
  const { setupData } = useAcademicData();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [courses, setCourses] = useState([]);
  const [mappings, setMappings] = useState({}); // { googleCourseId: subjectId }
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const userId = localStorage.getItem("userId") || "default-user";

  // 1. Fetch connection status on open
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchStatus = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await fetch(`http://localhost:5001/api/v1/classroom/status?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setConnected(data.data.isConnected);
          setGoogleEmail(data.data.email || "");

          if (data.data.isConnected) {
            // Fetch courses and existing mappings
            await Promise.all([fetchCourses(), fetchMappings()]);
          }
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to check Google Classroom status.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [isOpen]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/v1/classroom/courses?userId=${userId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCourses(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch courses.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not load Google Classroom courses.");
    }
  };

  const fetchMappings = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/v1/classroom/mappings?userId=${userId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const maps = {};
        data.data.forEach((m) => {
          maps[m.googleCourseId] = m.subjectId;
        });
        setMappings(maps);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Connect Redirect
  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/v1/classroom/auth-url?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.data.url) {
        // Save current route to navigate back
        localStorage.setItem("google_oauth_redirect_back", window.location.pathname);
        window.location.href = data.data.url;
      } else {
        throw new Error("Could not retrieve oauth url.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to start Google OAuth process.");
      setLoading(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect Google Classroom?")) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/v1/classroom/disconnect?userId=${userId}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setConnected(false);
        setGoogleEmail("");
        setCourses([]);
        setMappings({});
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to disconnect Classroom.");
    } finally {
      setLoading(false);
    }
  };

  // Save Course-Subject Maps
  const handleSaveMappings = async () => {
    setSaving(true);
    setErrorMessage("");
    try {
      const payload = Object.keys(mappings).map((courseId) => {
        const course = courses.find((c) => c.id === courseId);
        return {
          googleCourseId: courseId,
          subjectId: mappings[courseId],
          courseName: course ? course.name : "Google Classroom Course"
        };
      }).filter(m => m.subjectId); // exclude unmapped

      const res = await fetch(`http://localhost:5001/api/v1/classroom/mappings?userId=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: payload })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save course links.");
      }

      // Automatically trigger sync right after saving
      await handleSyncNow();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Error saving mappings.");
    } finally {
      setSaving(false);
    }
  };

  // Manual Trigger Sync Now
  const handleSyncNow = async () => {
    setSyncing(true);
    setErrorMessage("");
    try {
      const res = await fetch(`http://localhost:5001/api/v1/assignments/sync?userId=${userId}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        onSyncComplete?.();
        // Dispatch event to refresh Sidebar badge
        window.dispatchEvent(new Event("assignments-updated"));
      } else {
        throw new Error(data.message || "Sync coursework failed.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Error syncing assignments.");
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans text-left">
      <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 select-none">
            <CloudLightning className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Google Classroom Setup</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Checking authorization status...</span>
            </div>
          ) : !connected ? (
            /* Disconnected Status View */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto shadow-inner text-slate-400">
                <CloudLightning className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-slate-800">Link Google Classroom Account</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Import your academic assignments, course materials, tasks, and submission statuses directly. No passwords required.
                </p>
              </div>
              <button
                onClick={handleConnect}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 mx-auto cursor-pointer shadow-md"
              >
                <CloudLightning className="w-4 h-4" /> Connect Google Classroom
              </button>
            </div>
          ) : (
            /* Connected course mapping board */
            <div className="space-y-5">
              {/* Linked Card */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between gap-4 select-none">
                <div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                    Connected
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-2">{googleEmail}</p>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Disconnect
                </button>
              </div>

              {/* Course Mapping Settings */}
              <div className="space-y-3.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Course to Subject Mapping</h4>
                  <p className="text-[10px] text-slate-400">Map Google Classroom courses to SemPilot subjects to sync assignments correctly.</p>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {courses.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-semibold select-none">
                      No active courses found on Google Classroom.
                    </div>
                  ) : (
                    courses.map((course) => (
                      <div
                        key={course.id}
                        className="p-3 border border-slate-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block leading-tight">
                            {course.name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {course.section || "No Section"}
                          </span>
                        </div>

                        {/* Mapping select dropdown */}
                        <select
                          value={mappings[course.id] || ""}
                          onChange={(e) =>
                            setMappings({ ...mappings, [course.id]: e.target.value })
                          }
                          className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 font-medium"
                        >
                          <option value="">-- Unmapped --</option>
                          {setupData?.subjects.map((sub, sIdx) => (
                            <option key={sIdx} value={sub.id || sub.name}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        {connected && courses.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl shrink-0 flex justify-between gap-3 select-none">
            <button
              onClick={handleSyncNow}
              disabled={syncing || saving}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {syncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}{" "}
              Sync Now
            </button>

            <button
              onClick={handleSaveMappings}
              disabled={saving || syncing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}{" "}
              Save & Sync
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
