import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "../../shared/components/Sidebar";
import { TopNav } from "../../shared/components/TopNav";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  // Run onboarding gatekeeper redirect if setup is not complete
  useEffect(() => {
    const isSetupComplete = localStorage.getItem("sempilot_setup_complete") === "true";
    if (!isSetupComplete) {
      navigate("/setup");
    }
  }, [navigate]);

  // Map pathnames to nice titles
  const getPageTitle = (path) => {
    switch (path) {
      case "/":
        return "Today's Attendance";
      case "/overview":
        return "Overview";
      case "/attendance":
        return "Attendance Tracker";
      case "/timetable":
        return "Weekly Timetable";
      case "/calendar":
        return "Academic Calendar";
      case "/assignments":
        return "Assignments & Exams";
      case "/classroom":
        return "Google Classroom Integration";
      case "/ai-assistant":
        return "AI Copilot Assistant";
      case "/analytics":
        return "Analytics Hub";
      case "/notifications":
        return "Notifications Panel";
      default:
        return "Overview";
    }
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-50 relative">
      {/* Left Sidebar */}
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <TopNav title={title} onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto w-full space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
