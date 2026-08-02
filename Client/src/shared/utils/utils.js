import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

export async function syncAttendanceToBackend(logs = []) {
  try {
    const user = JSON.parse(localStorage.getItem("sempilot_user") || "null");
    const userId = user?.id || "default-user";

    const res = await fetch(`${API_BASE}/api/v1/attendance/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs, userId })
    });
    if (!res.ok) {
      console.warn("Failed to sync attendance to backend database:", await res.text());
    }
  } catch (err) {
    console.error("Failed to sync attendance to backend:", err);
  }
}

export async function syncFullDataToBackend(setupData, attendanceLogs) {
  try {
    const user = JSON.parse(localStorage.getItem("sempilot_user") || "null");
    const userId = user?.id || "default-user";

    if (!setupData?.semesterInfo) return;

    const facultyNames = [...new Set((setupData.timetableEntries || []).map(e => e.facultyName).filter(Boolean))];
    const faculties = facultyNames.map(name => ({
      name,
      department: "General Academics"
    }));

    const payload = {
      userId,
      semesterInfo: {
        name: setupData.semesterInfo.name || setupData.semesterInfo.semester || "My Semester",
        academicYear: setupData.semesterInfo.academicYear || "2026-27",
        startDate: setupData.semesterInfo.semesterStartDate || setupData.semesterInfo.startDate,
        endDate: setupData.semesterInfo.semesterEndDate || setupData.semesterInfo.endDate,
        attendanceRequirement: setupData.semesterInfo.attendanceRequirement || 75
      },
      faculties,
      subjects: (setupData.subjects || []).map(s => ({
        code: s.code || `${(s.name || "SUB").substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        name: s.name,
        type: s.type || "Theory",
        credits: s.credits || 3,
        facultyName: s.facultyName || "",
        priority: s.priority || "medium",
        difficulty: s.difficulty || "Medium",
        color: s.color || "blue"
      })),
      lectures: (setupData.timetableEntries || []).map(e => {
        const dayUpper = String(e.day).toUpperCase();
        return {
          subjectCode: setupData.subjects?.find(s => s.name === e.subjectName)?.code || e.subjectName || "",
          weekday: dayUpper,
          startTime: e.startTime,
          endTime: e.endTime,
          room: e.room || "",
          lectureType: e.lectureType || "Theory",
          repeatWeekly: true,
          facultyName: e.facultyName || ""
        };
      }),
      holidays: (setupData.holidays || []).map(h => ({
        name: h.name || h.title,
        date: h.date,
        description: h.description || ""
      }))
    };

    const res = await fetch(`${API_BASE}/api/v1/semester/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error("Failed to sync setup config to database:", await res.text());
    } else {
      console.log("Setup data sync and import transaction completed successfully on Neon DB!");
    }
  } catch (err) {
    console.error("Failed to sync full data configuration to backend:", err);
  }
}

export async function saveAndSyncAttendanceLogs(logs) {
  localStorage.setItem("sempilot_attendance_logs", JSON.stringify(logs));
  await syncAttendanceToBackend(logs);
}

export async function saveAndSyncSetupData(setupData) {
  localStorage.setItem("sempilot_setup_data", JSON.stringify(setupData));
  const attendanceLogs = JSON.parse(localStorage.getItem("sempilot_attendance_logs") || "[]");
  await syncFullDataToBackend(setupData, attendanceLogs);
}
