import React from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { Layout } from "../layouts/MainLayout/MainLayout";
import DesignSystem from "./DesignSystem";
import SemesterSetupWizard from "../features/setup/pages/SemesterSetupWizard";
import TimetablePage from "../features/timetable/pages/TimetablePage";
import Dashboard from "../features/dashboard/pages/Dashboard";
import TodayAttendance from "../features/dashboard/pages/TodayAttendance";
import AttendanceTracker from "../features/attendance/pages/AttendanceTracker";
import LandingPage from "../features/auth/pages/LandingPage";
import AcademicImportPage from "../features/setup/pages/AcademicImportPage";
import { AcademicDataProvider } from "../shared/context/AcademicDataContext";
import { AnalyticsHub } from "../features/analytics/pages/AnalyticsHub";
import { GoogleCallback } from "../features/auth/pages/GoogleCallback";
import { AssignmentsDashboard } from "../features/assignments/pages/AssignmentsDashboard";
import { AcademicCalendarPage } from "../features/calendar/pages/AcademicCalendarPage";
import { ClassroomPage } from "../features/assignments/pages/ClassroomPage";
import { AIAssistantPage } from "../features/ai-assistant/pages/AIAssistantPage";

// Simple, beautiful mock placeholders for future core pages
const PagePlaceholder = ({ name }) => (
  <div className="p-12 border border-dashed border-slate-200 bg-white rounded-lg flex flex-col items-center justify-center text-center space-y-4 min-h-[360px] max-w-3xl mx-auto shadow-sm">
    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 font-bold select-none text-sm">
      ⌥
    </div>
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold text-slate-800 tracking-tight">{name}</h3>
      <p className="text-xs text-slate-500 leading-relaxed max-w-md">
        This view is registered under the router. Scalable folder scaffolding is prepared. Ready for functional database connections and integrations.
      </p>
    </div>
  </div>
);

// Route guards
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem("sempilot_user");
  const isSetupComplete = localStorage.getItem("sempilot_setup_complete") === "true";

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isSetupComplete && window.location.pathname !== "/import") {
    return <Navigate to="/import" replace />;
  }

  return children ? children : <Outlet />;
};

const SetupGuard = ({ children }) => {
  const user = localStorage.getItem("sempilot_user");
  const isSetupComplete = localStorage.getItem("sempilot_setup_complete") === "true";

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isSetupComplete) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const LoginGuard = ({ children }) => {
  const user = localStorage.getItem("sempilot_user");
  const isSetupComplete = localStorage.getItem("sempilot_setup_complete") === "true";

  if (user) {
    if (!isSetupComplete) {
      return <Navigate to="/setup" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <LoginGuard>
        <LandingPage />
      </LoginGuard>
    ),
  },
  {
    path: "/google-callback",
    element: <GoogleCallback />,
  },
  {
    path: "/setup",
    element: (
      <SetupGuard>
        <AcademicDataProvider>
          <AcademicImportPage />
        </AcademicDataProvider>
      </SetupGuard>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AcademicDataProvider>
          <Layout />
        </AcademicDataProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/",
        element: <TodayAttendance />,
      },
      {
        path: "/import",
        element: <AcademicImportPage />,
      },
      {
        path: "/overview",
        element: <Dashboard />,
      },
      {
        path: "/attendance",
        element: <AttendanceTracker />,
      },
      {
        path: "/design-system",
        element: <DesignSystem />,
      },
      {
        path: "/timetable",
        element: <TimetablePage />,
      },
      {
        path: "/calendar",
        element: <AcademicCalendarPage />,
      },
      {
        path: "/assignments",
        element: <AssignmentsDashboard />,
      },
      {
        path: "/classroom",
        element: <ClassroomPage />,
      },
      {
        path: "/ai-assistant",
        element: <AIAssistantPage />,
      },
      {
        path: "/analytics",
        element: <AnalyticsHub />,
      },
      {
        path: "/notifications",
        element: <PagePlaceholder name="Notifications Panel Space" />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
export default AppRouter;
