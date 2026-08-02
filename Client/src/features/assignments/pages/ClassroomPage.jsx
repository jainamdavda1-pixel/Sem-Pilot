import React, { useState, useEffect } from "react";
import {
  CloudLightning,
  Loader2,
  Check,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Info,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export function ClassroomPage() {
  const { setupData } = useAcademicData();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [courses, setCourses] = useState([]);
  const [mappings, setMappings] = useState({}); // { googleCourseId: subjectId }
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const userId = localStorage.getItem("userId") || "default-user";

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/classroom/courses?userId=${userId}`);
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
      const res = await fetch(`${API_BASE}/api/v1/classroom/mappings?userId=${userId}`);
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

  const fetchStatus = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/classroom/status?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setConnected(data.data.isConnected);
        setGoogleEmail(data.data.email || "");

        if (data.data.isConnected) {
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

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/classroom/auth-url?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.data.url) {
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

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect Google Classroom?")) return;
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/classroom/disconnect?userId=${userId}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setConnected(false);
        setGoogleEmail("");
        setCourses([]);
        setMappings({});
        setSuccessMessage("Google Classroom account disconnected successfully.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to disconnect Classroom.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMappings = async () => {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload = Object.keys(mappings).map((courseId) => {
        const course = courses.find((c) => c.id === courseId);
        return {
          googleCourseId: courseId,
          subjectId: mappings[courseId],
          courseName: course ? course.name : "Google Classroom Course"
        };
      }).filter(m => m.subjectId);

      const res = await fetch(`${API_BASE}/api/v1/classroom/mappings?userId=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: payload })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save course links.");
      }

      await handleSyncNow();
      setSuccessMessage("Course mappings updated and synced successfully!");
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Error saving mappings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/assignments/sync?userId=${userId}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new Event("assignments-updated"));
        setSuccessMessage("Coursework synced successfully!");
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 font-sans text-left">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading Google Classroom console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans select-none max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Google Classroom Console</h1>
        <p className="text-xs text-slate-500 mt-1">Manage Classroom settings, sync logs, and map courses to subjects.</p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-semibold flex gap-2">
          <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-semibold flex gap-2">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
        {!connected ? (
          /* Disconnected View */
          <div className="text-center py-12 space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto shadow-inner text-slate-400">
              <CloudLightning className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800">Connect Google Classroom Account</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your account using secure Google OAuth. Sync coursework, track assignments, and view statuses in your academic dashboard.
              </p>
            </div>
            <button
              onClick={handleConnect}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 mx-auto cursor-pointer shadow-md"
            >
              <CloudLightning className="w-4 h-4" /> Link Google Classroom
            </button>
          </div>
        ) : (
          /* Connected Mapping View */
          <div className="space-y-6">
            {/* Connection Banner */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded uppercase select-none">
                  Authenticated
                </span>
                <p className="text-xs font-bold text-slate-800 mt-2">{googleEmail}</p>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Disconnect
              </button>
            </div>

            {/* Courses Mappings Table */}
            <div className="space-y-3.5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Active Course mappings</h3>
                <p className="text-xs text-slate-400">Link each imported Google course to its corresponding local subject.</p>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {courses.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-semibold select-none">
                    No active courses found on this Classroom profile.
                  </div>
                ) : (
                  courses.map((course) => (
                    <div
                      key={course.id}
                      className="p-3.5 border border-slate-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block leading-tight">
                          {course.name}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {course.section || "No Section"}
                        </span>
                      </div>

                      <select
                        value={mappings[course.id] || ""}
                        onChange={(e) =>
                          setMappings({ ...mappings, [course.id]: e.target.value })
                        }
                        className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 font-semibold"
                      >
                        <option value="">-- Unmapped / Skip Sync --</option>
                        {setupData?.subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Mapping Action Footer */}
            {courses.length > 0 && (
              <div className="pt-4 border-t border-slate-50 flex justify-between gap-3 select-none">
                <button
                  onClick={handleSyncNow}
                  disabled={syncing || saving}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {syncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}{" "}
                  Sync Coursework
                </button>

                <button
                  onClick={handleSaveMappings}
                  disabled={saving || syncing}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}{" "}
                  Save & Sync Course Mappings
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
