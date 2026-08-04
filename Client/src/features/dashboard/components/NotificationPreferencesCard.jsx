import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../shared/components/Card";
import { Button } from "../../../shared/components/Button";
import { Bell, Mail, Monitor, ShieldAlert, Loader2, Check } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

export function NotificationPreferencesCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preferences, setPreferences] = useState({
    globalEnabled: true,
    browserAssignments: true,
    browserAttendance: true,
    browserExams: true,
    browserAnnouncements: true,
    browserAI: true,
    emailAssignments: true,
    emailAttendance: true,
    emailExams: true,
    emailAI: true,
    emailAnnouncements: true
  });

  const userObj = JSON.parse(localStorage.getItem("sempilot_user") || "null");
  const userId = userObj?.id || "default-user";

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications/preferences?userId=${userId}`);
      const body = await res.json();
      if (res.ok && body.success) {
        setPreferences(body.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications/preferences?userId=${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences)
      });
      const body = await res.json();
      if (res.ok && body.success) {
        setPreferences(body.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save notification preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-slate-200/60 bg-white p-6 text-center select-none shadow-xs">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mx-auto" />
        <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Loading Alert Configurations...</span>
      </Card>
    );
  }

  const preferenceItems = [
    {
      label: "Coursework Assignments",
      desc: "Created, due tomorrow, due today, or overdue assignments alerts.",
      browserKey: "browserAssignments",
      emailKey: "emailAssignments"
    },
    {
      label: "Attendance Requirement Metrics",
      desc: "Daily drop thresholds alerts, weekly summaries, and bank updates.",
      browserKey: "browserAttendance",
      emailKey: "emailAttendance"
    },
    {
      label: "Term Evaluations & Exams",
      desc: "Weekly milestones reminders and countdowns to Midsem & Endsem papers.",
      browserKey: "browserExams",
      emailKey: "emailExams"
    },
    {
      label: "Official Faculty Notices",
      desc: "Department notices, cancelled lectures, and timetable updates.",
      browserKey: "browserAnnouncements",
      emailKey: "emailAnnouncements"
    },
    {
      label: "AI Personal Summaries",
      desc: "AI study plans, weekly projection digests, and recommendations.",
      browserKey: "browserAI",
      emailKey: "emailAI"
    }
  ];

  return (
    <Card className="border border-slate-200/60 bg-white shadow-sm overflow-hidden text-left font-sans select-none">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 flex items-center justify-between">
        <div>
          <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-indigo-500" /> Notification Alert Preferences
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-400">
            Configure how and when you receive browser push alerts and summary digests.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        
        {/* Global Toggle Switch */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700 block">Master Alerts Control</span>
            <span className="text-[10px] text-slate-400">Enable or disable all notifications across all delivery channels.</span>
          </div>
          <button
            onClick={() => handleToggle("globalEnabled")}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
              preferences.globalEnabled ? "bg-indigo-600" : "bg-slate-200"
            }`}
          >
            <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transform transition-transform duration-100 ${
              preferences.globalEnabled ? "translate-x-4.5" : "translate-x-0"
            }`} />
          </button>
        </div>

        {/* Detailed Preferences Grid */}
        <div className={`space-y-4 transition-opacity duration-200 ${!preferences.globalEnabled ? "opacity-45 pointer-events-none" : ""}`}>
          <div className="grid grid-cols-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
            <div className="col-span-1">Alert Category</div>
            <div className="text-center flex items-center justify-center gap-1"><Monitor className="w-3.5 h-3.5" /> Push</div>
            <div className="text-center flex items-center justify-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</div>
          </div>

          {preferenceItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 items-center py-2.5 border-b border-slate-100 last:border-0 gap-2">
              <div className="col-span-1 space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 block leading-tight">{item.label}</span>
                <span className="text-[9px] text-slate-400 leading-normal block">{item.desc}</span>
              </div>

              {/* Push Checkbox */}
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  checked={preferences[item.browserKey]}
                  onChange={() => handleToggle(item.browserKey)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Email Checkbox */}
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  checked={preferences[item.emailKey]}
                  onChange={() => handleToggle(item.emailKey)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-2.5">
          {success && (
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in duration-200">
              <Check className="w-3.5 h-3.5" /> Settings Saved!
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 px-4 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
