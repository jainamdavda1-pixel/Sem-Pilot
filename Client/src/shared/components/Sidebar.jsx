import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  Calendar,
  BookOpen,
  CloudLightning,
  Sparkles,
  BarChart3,
  Bell,
  Settings,
  UserCheck,
  LogOut,
  Upload
} from "lucide-react";
import { cn } from "../utils/utils";

export function Sidebar({ className }) {
  const user = JSON.parse(localStorage.getItem("sempilot_user") || "null") || {
    name: "Guest Student",
    email: "student@sempilot.io"
  };
  const initials = user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out of SemPilot?")) {
      localStorage.removeItem("sempilot_user");
      window.location.reload();
    }
  };

  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const userObj = JSON.parse(localStorage.getItem("sempilot_user") || "null");
        const userId = userObj?.id || "default-user";
        const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");
        const res = await fetch(`${API_BASE}/api/v1/assignments?userId=${userId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const pending = data.data.filter(
            (a) => a.status === "PENDING" || a.status === "IN_PROGRESS"
          ).length;
          setPendingCount(pending);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPendingCount();
    window.addEventListener("assignments-updated", fetchPendingCount);
    return () => window.removeEventListener("assignments-updated", fetchPendingCount);
  }, []);

  const menuItems = [
    { icon: UserCheck, label: "Today's Attendance", path: "/" },
    { icon: LayoutDashboard, label: "Overview", path: "/overview" },
    { icon: GraduationCap, label: "Attendance Tracker", path: "/attendance" },
    { icon: CalendarDays, label: "Weekly Timetable", path: "/timetable" },
    { icon: Upload, label: "Academic Data Import", path: "/import" },
    { icon: Calendar, label: "Academic Calendar", path: "/calendar" },
    { icon: BookOpen, label: "Assignments & Exams", path: "/assignments" },
    { icon: CloudLightning, label: "Google Classroom", path: "/classroom" },
    { icon: Sparkles, label: "AI Assistant", path: "/ai-assistant" },
    { icon: BarChart3, label: "Analytics Hub", path: "/analytics" },
  ];

  return (
    <aside className={cn("flex flex-col w-64 bg-slate-50/70 border-r border-slate-200/60 h-screen sticky top-0 shrink-0", className)}>
      {/* Brand Header */}
      <div className="h-14 border-b border-slate-200/60 flex items-center px-6 gap-2 bg-white">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs select-none">
          S
        </div>
        <span className="font-semibold text-slate-800 tracking-tight">SemPilot</span>
        <span className="text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.2 rounded-full">v2.0</span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Menu
        </div>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 select-none",
                isActive
                  ? "bg-white text-primary border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-500")} />
                  <span>{item.label}</span>
                </div>
                {item.path === "/assignments" && pendingCount > 0 && (
                  <span className="h-4.5 min-w-[18px] px-1.5 rounded-full bg-indigo-50 text-[9px] font-bold text-indigo-600 flex items-center justify-center border border-indigo-100/50 shrink-0">
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>


      {/* Quick Notifications shortcut & Profile Badge */}
      <div className="p-4 border-t border-slate-200/60 bg-white/50 space-y-3">
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            cn(
              "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100/70 hover:text-slate-900",
              isActive && "bg-white text-primary border border-slate-200 shadow-sm"
            )
          }
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-slate-400" />
            <span>Notifications</span>
          </div>
          <span className="h-5 w-5 rounded-full bg-blue-50 text-[10px] font-bold text-primary flex items-center justify-center border border-blue-200/50">
            3
          </span>
        </NavLink>

        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100/50 transition-colors group relative">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs border border-slate-200 uppercase select-none shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
          <button 
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-100 rounded shrink-0 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
