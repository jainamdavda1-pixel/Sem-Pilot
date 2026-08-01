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
          lectures: true,
          attendanceRecords: {
            include: {
              lecture: true
            }
          }
        }
      }
    }
  });

  if (!semester) {
    return res.status(200).json(new ApiResponse(200, { setupData: null, attendanceLogs: [] }, 'No semester data found'));
  }

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
        name: sub.name,
        priority,
        facultyStrictness: strictness,
        facultyName: sub.facultyName || ""
      };
    }),
    timetableEntries: []
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
        day: dayNameMapping[lec.dayOfWeek] || "Monday",
        subjectName: sub.name,
        startTime: lec.startTime,
        endTime: lec.endTime,
        lectureType: lec.lectureType === "LAB" ? "Practical" : lec.lectureType === "TUTORIAL" ? "Tutorial" : "Theory",
        room: lec.room || ""
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
      if (rec.lecture) {
        attendanceLogs.push({
          date: rec.lectureDate.toISOString().split('T')[0],
          subjectName: sub.name,
          startTime: rec.lecture.startTime,
          status: statusMapping[rec.status] || "Present",
          lectureType: rec.lecture.lectureType === "LAB" ? "Practical" : rec.lecture.lectureType === "TUTORIAL" ? "Tutorial" : "Theory"
        });
      }
    });
  });

  // Sort logs by date and startTime
  attendanceLogs.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.startTime.localeCompare(b.startTime);
  });

  return res.status(200).json(new ApiResponse(200, { setupData, attendanceLogs }, 'User data resolved successfully'));
});
