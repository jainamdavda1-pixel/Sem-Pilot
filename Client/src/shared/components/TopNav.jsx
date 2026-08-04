import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  HelpCircle, 
  CalendarRange, 
  Menu, 
  Bell, 
  Check, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  AlertTriangle, 
  Clock, 
  Info, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  X,
  RefreshCw
} from "lucide-react";
import { cn } from "../utils/utils";
import { registerPushNotifications } from "../utils/pushHelper.js";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

export function TopNav({ className, title = "Dashboard", onMenuClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const userObj = JSON.parse(localStorage.getItem("sempilot_user") || "null");
  const userId = userObj?.id || "default-user";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // 1. Fetch Notifications from database
  const fetchNotifications = async (resetPage = false) => {
    const targetPage = resetPage ? 1 : page;
    setLoading(true);
    try {
      const url = `${API_BASE}/api/v1/notifications?userId=${userId}&page=${targetPage}&limit=6&category=${category}&search=${searchTerm}`;
      const res = await fetch(url);
      const body = await res.json();
      if (res.ok && body.success) {
        if (targetPage === 1) {
          setNotifications(body.data.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(body.data.notifications || [])]);
        }
        setUnreadCount(body.data.unreadCount || 0);
        setTotalPages(body.data.pagination.totalPages || 1);
        if (resetPage) setPage(1);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger registration for web push & fetch preferences on startup
  useEffect(() => {
    registerPushNotifications();
    fetchNotifications(true);

    // Auto check every 45 seconds for new items
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 45000);

    return () => clearInterval(interval);
  }, [category]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter search trigger
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchNotifications(true);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Read markers triggers
  const handleMarkAsRead = async (id, link) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications/${id}/read`, {
        method: "PUT"
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
    if (link) {
      window.location.href = link;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMore = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 1) {
      fetchNotifications(false);
    }
  }, [page]);

  const categories = [
    { id: "all", label: "All" },
    { id: "assignments", label: "Assignments" },
    { id: "attendance", label: "Attendance" },
    { id: "exams", label: "Exams" },
    { id: "announcements", label: "Notices" },
    { id: "ai", label: "AI Suggestions" }
  ];

  // Helper mapping icon colors
  const getNotificationIcon = (type) => {
    const t = String(type || "").toUpperCase();
    if (t.startsWith("ASSIGNMENT")) {
      return <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0"><BookOpen className="w-4 h-4" /></div>;
    }
    if (t.startsWith("ATTENDANCE") || t.includes("REPORT")) {
      return <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0"><CheckCircle2 className="w-4 h-4" /></div>;
    }
    if (t.includes("EXAM") || t.includes("COUNTDOWN")) {
      return <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0"><AlertTriangle className="w-4 h-4" /></div>;
    }
    if (t.includes("AI") || t.startsWith("WEEKLY_ACADEMIC_SUMMARY")) {
      return <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 shrink-0"><Cpu className="w-4 h-4" /></div>;
    }
    return <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0"><Info className="w-4 h-4" /></div>;
  };

  return (
    <header className={cn("h-14 border-b border-slate-200/60 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0", className)}>
      {/* Page Title & Breadcrumbs */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xs text-slate-400 font-medium tracking-wide uppercase select-none hidden sm:inline">SemPilot</span>
        <span className="text-slate-300 hidden sm:inline">/</span>
        <h1 className="text-sm font-semibold text-slate-800 tracking-tight truncate max-w-[120px] sm:max-w-[250px] md:max-w-none">{title}</h1>
      </div>

      {/* Right Side Options */}
      <div className="flex items-center gap-4">
        {/* Command Palette Mock Search */}
        <div className="relative w-64 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search everything..."
            className="w-full h-8 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary transition-all duration-150"
            disabled
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-1 bg-white border border-slate-200 rounded text-[9px] font-medium text-slate-400 select-none shadow-[0_1px_1px_rgba(0,0,0,0.02)]">
            ⌘K
          </kbd>
        </div>

        {/* Dynamic Date display */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-medium text-slate-600 select-none">
          <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
          <span>{today}</span>
        </div>

        {/* Central Notification Center Bell */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 border border-slate-200 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-[8px] w-4.5 h-4.5 flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Popover list */}
          {isOpen && (
            <div className="absolute right-0 mt-2.5 w-[330px] sm:w-[410px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden font-sans text-left text-xs leading-normal animate-in fade-in slide-in-from-top-3 duration-150">
              
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-150 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Notification Center</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">{unreadCount} unread alerts</span>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="px-3.5 pt-3.5 pb-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search alert keywords..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-400 transition"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-2.5 p-0.5 hover:bg-slate-200 rounded-full"
                    >
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-3.5 py-2 flex gap-1 border-b border-slate-100 overflow-x-auto pb-2 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id); setPage(1); }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-bold border transition shrink-0 cursor-pointer",
                      category === cat.id
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                {loading && page === 1 ? (
                  <div className="py-12 text-center text-slate-400 font-medium flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                    <span>Syncing logs...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-medium">
                    📭 No alerts recorded in this category.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id, n.metadata?.link)}
                      className={cn(
                        "p-3.5 flex gap-3 hover:bg-slate-50/50 cursor-pointer transition select-none items-start",
                        !n.isRead && "bg-indigo-50/10 font-medium"
                      )}
                    >
                      {getNotificationIcon(n.type)}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-slate-800 truncate">{n.title}</span>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">{n.message}</p>
                        <span className="text-[9px] text-slate-400 font-semibold block pt-0.5">
                          {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Paging */}
              {page < totalPages && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full py-2.5 bg-slate-50 border-t border-slate-100 hover:bg-slate-100 text-center font-bold text-indigo-600 transition block text-[10px]"
                >
                  {loading ? "Loading more alerts..." : "Load Older Notifications"}
                </button>
              )}

            </div>
          )}
        </div>

        {/* Quick Help */}
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <HelpCircle className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}

