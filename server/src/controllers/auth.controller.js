import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';

export const googleAuth = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    throw new ApiError(400, 'Name and email are required');
  }

  // Find user by email, or create them
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email
      }
    });
  }

  return res.status(200).json(new ApiResponse(200, user, 'Authentication successful'));
});

export const getUserData = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const semester = await prisma.semester.findFirst({
    where: { userId },
    include: {
      holidays: true,
      subjects: {
        include: {
          faculty: true,
          lectures: {
            include: {
              faculty: true
            }
          },
          attendanceRecords: {
            include: {
              lecture: {
                include: {
                  faculty: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!semester) {
    return res.status(200).json(new ApiResponse(200, { setupData: null, attendanceLogs: [] }, 'No semester data found'));
  }

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

  // Format into frontend setupData format
  const setupData = {
    semesterInfo: {
      name: semester.name,
      academicYear: semester.academicYear,
      semesterStartDate: semester.startDate.toISOString().split('T')[0],
      semesterEndDate: semester.endDate.toISOString().split('T')[0],
      attendanceRequirement: semester.attendanceRequirement
    },
    subjects: semester.subjects.map(sub => {
      let priority = "medium";
      if (sub.subjectPriority === 5) priority = "very_high";
      else if (sub.subjectPriority === 4) priority = "high";
      else if (sub.subjectPriority === 2) priority = "low";

      let strictness = "medium";
      if (sub.facultyStrictness === 5) strictness = "high";
      else if (sub.facultyStrictness === 1) strictness = "low";

      return {
        id: sub.id,
        name: sub.name,
        code: sub.code,
        credits: sub.credits || 3,
        difficulty: sub.difficulty || "Medium",
        color: sub.color || "blue",
        priority,
        facultyStrictness: strictness,
        facultyName: sub.faculty?.name || ""
      };
    }),
    timetableEntries: [],
    holidays: (semester.holidays || []).map(h => ({
      id: h.id,
      name: h.title,
      date: h.date.toISOString().split('T')[0],
      description: h.description || ""
    }))
  };

  // Extract timetable entries
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
      setupData.timetableEntries.push({
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

  // Extract attendance records
  const statusMapping = {
    PRESENT: "Present",
    ABSENT: "Absent",
    CANCELLED: "Cancelled",
    HOLIDAY: "Holiday"
  };

  const attendanceLogs = [];
  semester.subjects.forEach(sub => {
    sub.attendanceRecords.forEach(rec => {
      const lec = sub.lectures.find(l => l.id === rec.lectureId);
      attendanceLogs.push({
        id: rec.id,
        date: rec.lectureDate.toISOString().split('T')[0],
        subjectName: sub.name,
        lectureType: lec ? formatLectureType(lec.lectureType) : "Theory",
        startTime: lec ? lec.startTime : "09:00",
        endTime: lec ? lec.endTime : "10:00",
        status: statusMapping[rec.status] || "Present",
        timestamp: new Date(rec.createdAt).getTime()
      });
    });
  });

  // Sort logs by date and startTime
  attendanceLogs.sort((a, b) => {
    const dateComp = (a.date || "").localeCompare(b.date || "");
    if (dateComp !== 0) return dateComp;
    return (a.startTime || "").localeCompare(b.startTime || "");
  });

  return res.status(200).json(new ApiResponse(200, { setupData, attendanceLogs }, 'User data resolved successfully'));
});
