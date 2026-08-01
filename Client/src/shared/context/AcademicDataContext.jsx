import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AcademicDataContext = createContext(null);

// Maps every backend lectureType enum value to its display label. Previously this
// only recognized LAB/TUTORIAL and silently collapsed WORKSHOP/PRACTICAL/SEMINAR/
// PROJECT lectures down to "Theory" - fixed to cover the full type set.
const LECTURE_TYPE_LABELS = {
  LAB: "Lab",
  TUTORIAL: "Tutorial",
  WORKSHOP: "Workshop",
  PRACTICAL: "Practical",
  SEMINAR: "Seminar",
  PROJECT: "Project",
  THEORY: "Theory"
};

const formatLectureType = (type) => LECTURE_TYPE_LABELS[String(type || "").toUpperCase()] || "Theory";

export function AcademicDataProvider({ children }) {
  const [setupData, setSetupData] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = JSON.parse(localStorage.getItem("sempilot_user") || "null");
      const userId = user?.id || "default-user";

      const res = await fetch(`http://localhost:5001/api/v1/semesters/active?userId=${userId}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }

      const body = await res.json();
      const semester = body.data;

      if (!semester) {
        setSetupData(null);
        setAttendanceLogs([]);
        localStorage.setItem("sempilot_setup_complete", "false");
        setLoading(false);
        return;
      }

      // Map back to the expected setupData format
      const formattedSetup = {
        semesterInfo: {
          name: semester.name,
          academicYear: semester.academicYear,
          semesterStartDate: semester.startDate.split("T")[0],
          semesterEndDate: semester.endDate.split("T")[0],
          attendanceRequirement: semester.attendanceRequirement
        },
        subjects: semester.subjects.map(sub => {
          let priority = "medium";
          if (sub.subjectPriority === 5) priority = "very_high";
          else if (sub.subjectPriority === 4) priority = "high";
          else if (sub.subjectPriority === 2) priority = "low";

          return {
            id: sub.id,
            name: sub.name,
            code: sub.code,
            credits: sub.credits || 3,
            difficulty: sub.difficulty || "Medium",
            color: sub.color || "blue",
            priority
          };
        }),
        timetableEntries: [],
        holidays: (semester.holidays || []).map(h => ({
          id: h.id,
          name: h.title,
          date: h.date.split("T")[0],
          description: h.description || ""
        }))
      };

      // Map timetable entries
      const dayNameMapping = {
        MONDAY: "Monday",
        TUESDAY: "Tuesday",
        WEDNESDAY: "Wednesday",
        THURSDAY: "Thursday",
        FRIDAY: "Friday",
        SATURDAY: "Saturday",
        SUNDAY: "Sunday"
      };

      semester.subjects.forEach(sub => {
        sub.lectures.forEach(lec => {
          formattedSetup.timetableEntries.push({
            id: lec.id,
            day: dayNameMapping[lec.dayOfWeek] || "Monday",
            subjectName: sub.name,
            startTime: lec.startTime,
            endTime: lec.endTime,
            lectureType: formatLectureType(lec.lectureType),
            room: lec.room || "",
            facultyName: lec.faculty?.name || ""
          });
        });
      });

      // Map attendance logs
      const statusMapping = {
        PRESENT: "Present",
        ABSENT: "Absent",
        CANCELLED: "Cancelled",
        HOLIDAY: "Holiday"
      };

      const logs = [];
      semester.subjects.forEach(sub => {
        sub.attendanceRecords.forEach(rec => {
          const lec = sub.lectures.find(l => l.id === rec.lectureId);
          logs.push({
            id: rec.id,
            date: rec.lectureDate.split("T")[0],
            subjectName: sub.name,
            lectureType: lec ? formatLectureType(lec.lectureType) : "Theory",
            startTime: lec ? lec.startTime : "09:00",
            endTime: lec ? lec.endTime : "10:00",
            status: statusMapping[rec.status] || "Present",
            timestamp: new Date(rec.createdAt).getTime()
          });
        });
      });

      // Sort logs chronologically
      logs.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

      setSetupData(formattedSetup);
      setAttendanceLogs(logs);
      localStorage.setItem("sempilot_setup_complete", "true");

      // Set fallback local storage caches so legacy operations don't break during transition
      localStorage.setItem("sempilot_setup_data", JSON.stringify(formattedSetup));
      localStorage.setItem("sempilot_attendance_logs", JSON.stringify(logs));

    } catch (err) {
      console.error("Failed to load active semester data from Neon DB:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Optimistic UI updates helper for immediate attendance status toggle
  const updateAttendanceOptimistic = useCallback((date, subjectName, startTime, status) => {
    setAttendanceLogs(prev => {
      const idx = prev.findIndex(
        l => l.date === date && l.subjectName === subjectName && l.startTime === startTime
      );
      const newLogs = [...prev];
      if (idx !== -1) {
        newLogs[idx] = { ...newLogs[idx], status };
      } else {
        newLogs.push({
          id: `opt-${Date.now()}`,
          date,
          subjectName,
          startTime,
          status,
          lectureType: "Theory",
          timestamp: Date.now()
        });
      }
      return newLogs;
    });
  }, []);

  return (
    <AcademicDataContext.Provider value={{
      setupData,
      setSetupData,
      attendanceLogs,
      loading,
      error,
      refreshData,
      updateAttendanceOptimistic
    }}>
      {children}
    </AcademicDataContext.Provider>
  );
}

export function useAcademicData() {
  const context = useContext(AcademicDataContext);
  if (!context) {
    throw new Error("useAcademicData must be used within an AcademicDataProvider");
  }
  return context;
}
