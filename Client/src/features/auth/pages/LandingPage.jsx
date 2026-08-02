import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Download, 
  ShieldCheck, 
  Calendar, 
  Activity, 
  Database,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent } from "../../../shared/components/Card";
import { Button } from "../../../shared/components/Button";
import { Badge } from "../../../shared/components/Badge";

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0 animate-in fade-in" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function LandingPage() {
  const navigate = useNavigate();
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [hasLocalData, setHasLocalData] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Check if existing data exists to warn and prompt backup download
  useEffect(() => {
    const rawSetup = localStorage.getItem("sempilot_setup_data");
    const rawLogs = localStorage.getItem("sempilot_attendance_logs");
    if (rawSetup || rawLogs) {
      setHasLocalData(true);
    }
  }, []);

  const downloadBackup = () => {
    const setupData = JSON.parse(localStorage.getItem("sempilot_setup_data") || "null");
    const attendanceLogs = JSON.parse(localStorage.getItem("sempilot_attendance_logs") || "[]");
    
    const backupObj = {
      backupDate: new Date().toISOString(),
      setupData,
      attendanceLogs
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `sempilot_backup_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleLoginSuccess = async (name, email) => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const body = await res.json();
      const userData = body.data;

      // Save user to localStorage
      localStorage.setItem("sempilot_user", JSON.stringify(userData));

      // 1. Fetch user data from database to restore sessions on clean browser cache
      let serverSetupData = null;
      let serverLogs = [];
      try {
        const dbRes = await fetch(`${API_BASE}/api/v1/auth/user-data/${userData.id}`);
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          if (dbData && dbData.data && dbData.data.setupData) {
            serverSetupData = dbData.data.setupData;
            serverLogs = dbData.data.attendanceLogs || [];
            
            // Restore to localStorage
            localStorage.setItem("sempilot_setup_data", JSON.stringify(serverSetupData));
            localStorage.setItem("sempilot_attendance_logs", JSON.stringify(serverLogs));
            localStorage.setItem("sempilot_setup_complete", "true");
          }
        }
      } catch (dbErr) {
        console.error("Failed to restore session data from Neon database:", dbErr);
      }

      // 2. If no server records found, check if local storage has data to sync up
      if (!serverSetupData) {
        const rawSetup = localStorage.getItem("sempilot_setup_data");
        const rawLogs = localStorage.getItem("sempilot_attendance_logs");
        if (rawSetup) {
          try {
            const setup = JSON.parse(rawSetup);
            const logs = rawLogs ? JSON.parse(rawLogs) : [];
            
            await fetch(`${API_BASE}/api/v1/semesters/sync-full-data`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ setupData: setup, attendanceLogs: logs, userId: userData.id })
            });
            localStorage.setItem("sempilot_setup_complete", "true");
            serverSetupData = setup;
          } catch (syncErr) {
            console.error("Post-login data sync error:", syncErr);
          }
        }
      }

      // 3. Route according to configuration presence
      if (serverSetupData || localStorage.getItem("sempilot_setup_complete") === "true") {
        navigate("/");
      } else {
        navigate("/setup");
      }
    } catch (err) {
      console.error("Login failed:", err);
      alert(`Sign in failed. Make sure your backend is running and reachable at: ${API_BASE}\n\nError: ${err.message}`);
    } finally {
      setSyncing(false);
      setShowGoogleModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* Radiant Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-sky-500/5 blur-[90px]" />

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center z-10 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            SemPilot
          </span>
          <Badge className="bg-blue-500/10 border border-blue-400/20 text-blue-400 text-[9px] uppercase tracking-wider px-1.5 py-0">v2.0</Badge>
        </div>

        {hasLocalData && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadBackup}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download Local Backup
          </Button>
        )}
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1 z-10">
        
        {/* Left Hand: Hero Copy and Features */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Cloud Database Integration is Live
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-sans">
              Own Your Semester. <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                Dominate Attendance.
              </span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
              Track classes, auto-calculate margins, analyze strictness tiers, and visualize timelines. Sync dynamically from your browser local storage directly to Neon PostgreSQL.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-xs flex gap-3 items-start">
              <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Google Calendar Schedule</h4>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Vibrant pastel codes, custom lecture styles, and collision detection warnings.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-xs flex gap-3 items-start">
              <Activity className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Attendance Safety Margin</h4>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Calculates margins automatically: "Safe to skip 2 classes" or "Must attend."</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-xs flex gap-3 items-start">
              <Download className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Spreadsheet File Import</h4>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Drop official attendance sheets to automatically parse and log entries.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-xs flex gap-3 items-start">
              <Database className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Neon Cloud Sync</h4>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Non-blocking active transaction syncs keep records secured in PostgreSQL.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: SignIn Card Portal */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <Card className="border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-2xl w-full max-w-sm overflow-hidden select-none">
            <CardContent className="p-8 space-y-6 flex flex-col justify-between">
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-b from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-1">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Access SemPilot</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                  Log in to create semester milestones and secure attendance logs to Neon.
                </p>
              </div>

              {/* Local Storage warning alerts if present */}
              {hasLocalData && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400 flex gap-2 items-start leading-normal text-left">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold">Backup Recommended:</span> Logged items found in browser storage. Click the header button to save a copy before authentication resets tables.
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setShowGoogleModal(true)}
                disabled={syncing}
                className="w-full bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900 py-6 text-xs font-extrabold tracking-wide uppercase flex items-center justify-center gap-3 shadow-md shadow-white/5 transition-all"
              >
                <GoogleIcon />
                Sign in with Google
              </Button>

              <div className="text-center pt-2 select-none">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
                  Secure OAuth Authentication
                </span>
              </div>

            </CardContent>
          </Card>
        </div>

      </main>

      {/* Simple Footer */}
      <footer className="w-full py-6 text-center text-[10px] text-slate-500 font-medium border-t border-slate-800/40 bg-slate-950/20 z-10 select-none">
        © {new Date().getFullYear()} SemPilot Platform. Made with active Neon Cloud Sync pipeline.
      </footer>

      {/* Google Mock Account Selector Overlay Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl max-w-sm w-full overflow-hidden text-left animate-in zoom-in-95 duration-150 p-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 select-none">
              <div className="flex items-center gap-1.5">
                <GoogleIcon />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Google Account Selector
                </span>
              </div>
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold font-sans"
              >
                Cancel
              </button>
            </div>

            {/* Simulated Accounts Options list */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                Choose an account to continue to SemPilot
              </span>

              {/* Acc 1 */}
              <button
                onClick={() => handleLoginSuccess("Jainam Davda", "jainamdavda1@gmail.com")}
                disabled={syncing}
                className="w-full p-3 rounded-xl border border-slate-800 hover:border-blue-500 bg-slate-950/40 hover:bg-blue-500/5 flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 uppercase">
                  JD
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Jainam Davda</h4>
                  <p className="text-[10px] text-slate-400">jainamdavda1@gmail.com</p>
                </div>
              </button>

              {/* Acc 2 */}
              <button
                onClick={() => handleLoginSuccess("Guest Student", "guest@sempilot.io")}
                disabled={syncing}
                className="w-full p-3 rounded-xl border border-slate-800 hover:border-blue-500 bg-slate-950/40 hover:bg-blue-500/5 flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 uppercase">
                  GS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Guest Student</h4>
                  <p className="text-[10px] text-slate-400">guest@sempilot.io</p>
                </div>
              </button>
            </div>

            {/* Custom Account Text Form */}
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                Or sign in with a different profile
              </span>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:border-blue-500 focus:outline-none placeholder-slate-600"
                />
                <input 
                  type="email" 
                  placeholder="Email address" 
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:border-blue-500 focus:outline-none placeholder-slate-600"
                />
              </div>

              <Button
                onClick={() => handleLoginSuccess(customName || "Custom Student", customEmail || "student@academy.edu")}
                disabled={syncing || !customName || !customEmail}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg"
              >
                {syncing ? "Connecting..." : "Continue with Custom Email"}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
