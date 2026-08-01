import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { SemesterService } from '../services/semester.service.js';
import { prisma } from '../lib/prisma.js';

const semesterService = new SemesterService();

export const getSemester = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const semester = await semesterService.getSemesterById(id);
  if (!semester) {
    throw new ApiError(404, 'Semester not found');
  }
  return res.status(200).json(new ApiResponse(200, semester, 'Semester fetched successfully'));
});

export const getSemesters = asyncHandler(async (req, res) => {
  const userId = req.query.userId || 'default-user';
  const semesters = await semesterService.getUserSemesters(userId);
  return res.status(200).json(new ApiResponse(200, semesters, 'Semesters fetched successfully'));
});

export const createSemester = asyncHandler(async (req, res) => {
  const { name, academicYear, startDate, endDate, attendanceRequirement, userId } = req.body;
  if (!name || !academicYear || !startDate || !endDate) {
    throw new ApiError(400, 'Name, academicYear, startDate, and endDate are required');
  }
  
  const semester = await semesterService.createSemester({
    name,
    academicYear,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    attendanceRequirement: attendanceRequirement ? parseInt(attendanceRequirement, 10) : undefined,
    userId: userId || undefined
  });
  return res.status(201).json(new ApiResponse(201, semester, 'Semester created successfully'));
});

export const updateSemester = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, academicYear, startDate, endDate, attendanceRequirement } = req.body;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (academicYear) updateData.academicYear = academicYear;
  if (startDate) updateData.startDate = new Date(startDate);
  if (endDate) updateData.endDate = new Date(endDate);
  if (attendanceRequirement !== undefined) {
    updateData.attendanceRequirement = parseInt(attendanceRequirement, 10);
  }

  const semester = await semesterService.updateSemester(id, updateData);
  return res.status(200).json(new ApiResponse(200, semester, 'Semester updated successfully'));
});

export const deleteSemester = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await semesterService.deleteSemester(id);
  return res.status(200).json(new ApiResponse(200, null, 'Semester deleted successfully'));
});

export const syncFullData = asyncHandler(async (req, res) => {
  const { setupData, attendanceLogs, userId } = req.body;
  console.log(`[INFO] syncFullData request received. Logs count: ${attendanceLogs?.length || 0}, UserID: ${userId}`);
  if (!setupData) {
    throw new ApiError(400, 'setupData is required');
  }

  // Find or create user
  const resolvedUserId = userId || 'default-user';
  let user = await prisma.user.findUnique({
    where: { id: resolvedUserId }
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: resolvedUserId,
        name: 'Student'
      }
    });
  }

  // 1. Resolve Semester Info
  const semesterInfo = setupData.semesterInfo || {};
  const startDate = semesterInfo.semesterStartDate || semesterInfo.startDate;
  const endDate = semesterInfo.semesterEndDate || semesterInfo.endDate;
  const attendanceRequirement = parseInt(semesterInfo.attendanceRequirement || 75, 10);
  const name = semesterInfo.name || "Active Semester";
  const academicYear = semesterInfo.academicYear || "2026-2027";

  if (!startDate || !endDate) {
    throw new ApiError(400, 'semester start and end dates are required inside setupData.semesterInfo');
  }

  // Transaction block to keep operations atomic
  const result = await prisma.$transaction(async (tx) => {
    // Upsert Semester
    let semester = await tx.semester.findFirst({
      where: { userId: user.id }
    });

    if (semester) {
      semester = await tx.semester.update({
        where: { id: semester.id },
        data: {
          name,
          academicYear,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          attendanceRequirement
        }
      });
    } else {
      semester = await tx.semester.create({
        data: {
          name,
          academicYear,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          attendanceRequirement,
          userId: user.id
        }
      });
    }

    // Clear existing subjects and their lectures/attendance cascades
    const existingSubjects = await tx.subject.findMany({
      where: { semesterId: semester.id }
    });
    
    for (const sub of existingSubjects) {
      // Clear attendance records
      await tx.attendance.deleteMany({
        where: { subjectId: sub.id }
      });
      // Clear lectures
      await tx.lecture.deleteMany({
        where: { subjectId: sub.id }
      });
    }
    // Delete subjects
    await tx.subject.deleteMany({
      where: { semesterId: semester.id }
    });

    // 2. Re-create Subjects (filtering out default subjects not in timetable or logs)
    const activeSubjectNames = new Set([
      ...(setupData.timetableEntries || []).map(e => e.subjectName?.trim().toLowerCase()).filter(Boolean),
      ...(attendanceLogs || []).map(e => e.subjectName?.trim().toLowerCase()).filter(Boolean)
    ]);

    // Resolve all unique faculty names
    const facultyNames = new Set();
    const timetableEntries = setupData.timetableEntries || [];
    
    (setupData.subjects || []).forEach(s => {
      if (s.facultyName) facultyNames.add(s.facultyName.trim());
    });
    timetableEntries.forEach(e => {
      if (e.facultyName) facultyNames.add(e.facultyName.trim());
    });

    const facultyMap = {}; // nameClean -> Faculty DB object
    for (const fName of facultyNames) {
      const fNameClean = fName.toLowerCase();
      if (facultyMap[fNameClean]) continue;

      const dbFac = await tx.faculty.create({
        data: {
          name: fName,
          department: "General Academics",
          semesterId: semester.id
        }
      });
      facultyMap[fNameClean] = dbFac;
    }

    const subjectsMap = {}; // name -> DB Subject object
    const setupSubjects = setupData.subjects || [];
    for (const sub of setupSubjects) {
      const subNameClean = sub.name.trim().toLowerCase();
      if (!activeSubjectNames.has(subNameClean)) {
        continue;
      }

      let facultyId = null;
      if (sub.facultyName) {
        const match = facultyMap[sub.facultyName.trim().toLowerCase()];
        if (match) facultyId = match.id;
      }

      const createdSub = await tx.subject.create({
        data: {
          name: sub.name,
          code: sub.code || `${sub.name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          type: sub.type?.toUpperCase() === 'LAB' ? 'LAB' : sub.type?.toUpperCase() === 'TUTORIAL' ? 'TUTORIAL' : 'THEORY',
          credits: 3,
          facultyId,
          semesterId: semester.id
        }
      });
      subjectsMap[subNameClean] = createdSub;
    }

    // 3. Re-create Timetable Lectures
    const lecturesList = []; // Array of created lectures with details to map to logs
    for (const entry of timetableEntries) {
      const subKey = entry.subjectName?.trim().toLowerCase();
      let dbSub = subjectsMap[subKey];
      
      // If subject didn't exist in setupData.subjects, create it now
      if (!dbSub && entry.subjectName) {
        dbSub = await tx.subject.create({
          data: {
            name: entry.subjectName,
            code: `${entry.subjectName.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
            type: (entry.lectureType?.toUpperCase() === 'LAB' || entry.lectureType?.toUpperCase() === 'PRACTICAL' || entry.subjectName?.toLowerCase().includes('practical') || entry.subjectName?.toLowerCase().includes('lab')) ? 'LAB' : 'THEORY',
            semesterId: semester.id
          }
        });
        subjectsMap[subKey] = dbSub;
      }

      if (!dbSub) continue;

      const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      let dayEnum = "MONDAY";
      if (entry.day) {
        const match = weekdays.find(w => w === entry.day.toUpperCase());
        if (match) dayEnum = match;
      }

      let facultyId = dbSub.facultyId;
      if (entry.facultyName) {
        const match = facultyMap[entry.facultyName.trim().toLowerCase()];
        if (match) facultyId = match.id;
      }

      const createdLect = await tx.lecture.create({
        data: {
          dayOfWeek: dayEnum,
          startTime: entry.startTime || "09:00",
          endTime: entry.endTime || "10:00",
          lectureType: entry.lectureType?.toUpperCase() === 'LAB' ? 'LAB' : entry.lectureType?.toUpperCase() === 'TUTORIAL' ? 'TUTORIAL' : 'THEORY',
          room: entry.room || null,
          subjectId: dbSub.id,
          facultyId
        }
      });
      lecturesList.push({
        lecture: createdLect,
        subjectName: entry.subjectName,
        startTime: entry.startTime
      });
    }

    // 4. Create Attendance Logs
    const syncedAttendance = [];
    const logs = attendanceLogs || [];
    for (const log of logs) {
      const { date, subjectName, startTime, status, lectureType } = log;
      if (!date || !subjectName || !status) continue;

      // Find matching subject
      const subKey = subjectName.trim().toLowerCase();
      let dbSub = subjectsMap[subKey];

      // If subject still doesn't exist, create it
      if (!dbSub) {
        dbSub = await tx.subject.create({
          data: {
            name: subjectName,
            code: `${subjectName.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
            type: (lectureType?.toUpperCase() === 'LAB' || lectureType?.toUpperCase() === 'PRACTICAL' || subjectName?.toLowerCase().includes('practical') || subjectName?.toLowerCase().includes('lab')) ? 'LAB' : 'THEORY',
            semesterId: semester.id
          }
        });
        subjectsMap[subKey] = dbSub;
      }

      // Find matching lecture slot
      const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const logDate = new Date(date);
      const dayName = weekdays[logDate.getDay()];

      let matchLect = lecturesList.find(
        item => item.subjectName.trim().toLowerCase() === subKey &&
                item.startTime === startTime &&
                item.lecture.dayOfWeek === dayName
      )?.lecture;

      // If not found in timetable entries list, find or create dynamically
      if (!matchLect) {
        matchLect = await tx.lecture.create({
          data: {
            dayOfWeek: dayName,
            startTime: startTime || "09:00",
            endTime: log.endTime || "10:00",
            lectureType: (lectureType?.toUpperCase() === 'LAB' || lectureType?.toUpperCase() === 'PRACTICAL' || subjectName?.toLowerCase().includes('practical') || subjectName?.toLowerCase().includes('lab')) ? 'LAB' : 'THEORY',
            subjectId: dbSub.id
          }
        });
        lecturesList.push({
          lecture: matchLect,
          subjectName: subjectName,
          startTime: startTime
        });
      }

      // Map status
      let dbStatus = "PRESENT";
      if (status.toLowerCase() === "absent") dbStatus = "ABSENT";
      else if (status.toLowerCase() === "cancelled") dbStatus = "CANCELLED";
      else if (status.toLowerCase() === "holiday") dbStatus = "HOLIDAY";

      const createdAtt = await tx.attendance.create({
        data: {
          lectureDate: new Date(date),
          status: dbStatus,
          lectureId: matchLect.id,
          subjectId: dbSub.id,
          remarks: log.remarks || null
        }
      });
      syncedAttendance.push(createdAtt);
    }

    return {
      semester,
      subjectsCount: Object.keys(subjectsMap).length,
      lecturesCount: lecturesList.length,
      attendanceCount: syncedAttendance.length
    };
  }, {
    timeout: 25000
  });

  return res.status(200).json(new ApiResponse(200, result, 'Full data configuration and history logs synchronized to PostgreSQL database successfully'));
});

export const importFullData = asyncHandler(async (req, res) => {
  const { userId, semesterInfo, faculties, subjects, lectures, holidays } = req.body;
  if (!userId) {
    throw new ApiError(400, 'userId is required');
  }
  if (!semesterInfo || !semesterInfo.name || !semesterInfo.startDate || !semesterInfo.endDate) {
    throw new ApiError(400, 'Semester info (name, startDate, endDate) is required');
  }

  const errors = [];
  const warnings = [];

  const validWeekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  
  const facultyNamesInPayload = new Set();
  const duplicateFacultyNames = new Set();
  (faculties || []).forEach(f => {
    if (!f.name || !f.department) {
      errors.push(`Faculty validation error: Missing name or department in row.`);
    }
    const nameClean = f.name?.trim().toLowerCase();
    if (facultyNamesInPayload.has(nameClean)) {
      duplicateFacultyNames.add(f.name);
    }
    facultyNamesInPayload.add(nameClean);
  });
  
  if (duplicateFacultyNames.size > 0) {
    warnings.push(`Duplicate faculties detected in payload: ${[...duplicateFacultyNames].join(', ')}. They will be consolidated.`);
  }

  const subjectCodesInPayload = new Set();
  const duplicateSubjectCodes = new Set();
  (subjects || []).forEach(s => {
    if (!s.code || !s.name) {
      errors.push(`Subject validation error: Missing code or name in row.`);
    }
    const codeClean = s.code?.trim().toUpperCase();
    if (subjectCodesInPayload.has(codeClean)) {
      duplicateSubjectCodes.add(s.code);
    }
    subjectCodesInPayload.add(codeClean);
  });

  if (duplicateSubjectCodes.size > 0) {
    errors.push(`Duplicate subject codes detected: ${[...duplicateSubjectCodes].join(', ')}.`);
  }

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(':');
    if (parts.length < 2) return 0;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const lectureTimeRangeErrors = [];
  const lectureDayErrors = [];
  const roomSchedules = {}; 
  const facultySchedules = {}; 

  (lectures || []).forEach((lec, idx) => {
    const startMins = parseTimeToMinutes(lec.startTime);
    const endMins = parseTimeToMinutes(lec.endTime);
    const weekdayUpper = lec.weekday?.toUpperCase().trim();

    if (startMins >= endMins) {
      lectureTimeRangeErrors.push(`Lecture #${idx + 1} (${lec.subjectCode}): Start time (${lec.startTime}) must be before end time (${lec.endTime}).`);
    }

    if (!validWeekdays.includes(weekdayUpper)) {
      lectureDayErrors.push(`Lecture #${idx + 1} (${lec.subjectCode}): Invalid weekday name "${lec.weekday}".`);
    }

    if (weekdayUpper && startMins < endMins) {
      if (lec.room) {
        if (!roomSchedules[weekdayUpper]) roomSchedules[weekdayUpper] = {};
        if (!roomSchedules[weekdayUpper][lec.room]) roomSchedules[weekdayUpper][lec.room] = [];

        const conflicts = roomSchedules[weekdayUpper][lec.room].filter(
          sched => startMins < sched.end && endMins > sched.start
        );
        if (conflicts.length > 0) {
          errors.push(`Scheduling collision: Room "${lec.room}" is double-booked on ${lec.weekday} at ${lec.startTime}-${lec.endTime}.`);
        }
        roomSchedules[weekdayUpper][lec.room].push({ start: startMins, end: endMins, sub: lec.subjectCode });
      }

      if (lec.facultyName) {
        if (!facultySchedules[weekdayUpper]) facultySchedules[weekdayUpper] = {};
        const facClean = lec.facultyName.trim().toLowerCase();
        if (!facultySchedules[weekdayUpper][facClean]) facultySchedules[weekdayUpper][facClean] = [];

        const conflicts = facultySchedules[weekdayUpper][facClean].filter(
          sched => startMins < sched.end && endMins > sched.start
        );
        if (conflicts.length > 0) {
          errors.push(`Faculty collision: "${lec.facultyName}" is scheduled for multiple sessions simultaneously on ${lec.weekday} at ${lec.startTime}-${lec.endTime}.`);
        }
        facultySchedules[weekdayUpper][facClean].push({ start: startMins, end: endMins, sub: lec.subjectCode });
      }
    }
  });

  errors.push(...lectureTimeRangeErrors, ...lectureDayErrors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Academic validation failed",
      errors,
      warnings
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        user = await tx.user.create({
          data: { id: userId, name: "Jainam Davda" }
        });
      }

      const oldSemesters = await tx.semester.findMany({ where: { userId } });
      for (const sem of oldSemesters) {
        await tx.attendance.deleteMany({ where: { subject: { semesterId: sem.id } } });
        await tx.lecture.deleteMany({ where: { subject: { semesterId: sem.id } } });
        await tx.subject.deleteMany({ where: { semesterId: sem.id } });
        await tx.faculty.deleteMany({ where: { semesterId: sem.id } });
        await tx.holiday.deleteMany({ where: { semesterId: sem.id } });
        await tx.semester.delete({ where: { id: sem.id } });
      }

      const semester = await tx.semester.create({
        data: {
          name: semesterInfo.name,
          academicYear: semesterInfo.academicYear || "2026-2027",
          startDate: new Date(semesterInfo.startDate),
          endDate: new Date(semesterInfo.endDate),
          attendanceRequirement: parseInt(semesterInfo.attendanceRequirement || 75, 10),
          userId
        }
      });

      const facultyMap = {}; 
      for (const fac of faculties || []) {
        const facClean = fac.name.trim().toLowerCase();
        if (facultyMap[facClean]) continue; 
        
        const createdFac = await tx.faculty.create({
          data: {
            name: fac.name,
            department: fac.department || "General Academics",
            email: fac.email || null,
            cabin: fac.cabin || null,
            designation: fac.designation || null,
            semesterId: semester.id
          }
        });
        facultyMap[facClean] = createdFac;
      }

      const subjectsMap = {}; 
      for (const sub of subjects || []) {
        const codeUpper = sub.code.trim().toUpperCase();
        
        let dbFacultyId = null;
        if (sub.facultyName) {
          const facClean = sub.facultyName.trim().toLowerCase();
          const matchFac = facultyMap[facClean];
          if (matchFac) {
            dbFacultyId = matchFac.id;
          }
        }

        const createdSub = await tx.subject.create({
          data: {
            code: codeUpper,
            name: sub.name,
            type: (sub.type?.toUpperCase() === 'LAB' || sub.type?.toUpperCase() === 'PRACTICAL' || sub.name?.toLowerCase().includes('practical') || sub.name?.toLowerCase().includes('lab')) ? 'LAB' : sub.type?.toUpperCase() === 'TUTORIAL' ? 'TUTORIAL' : 'THEORY',
            credits: sub.credits ? parseInt(sub.credits, 10) : 3,
            difficulty: sub.difficulty || 'Medium',
            color: sub.color || 'blue',
            facultyId: dbFacultyId,
            semesterId: semester.id
          }
        });
        subjectsMap[codeUpper] = createdSub;
      }

      let lecturesCount = 0;
      for (const lec of lectures || []) {
        const codeUpper = lec.subjectCode.trim().toUpperCase();
        const dbSub = subjectsMap[codeUpper];
        if (!dbSub) continue;

        let dbFacultyId = dbSub.facultyId;
        if (lec.facultyName) {
          const facClean = lec.facultyName.trim().toLowerCase();
          const matchFac = facultyMap[facClean];
          if (matchFac) {
            dbFacultyId = matchFac.id;
          }
        }

        await tx.lecture.create({
          data: {
            dayOfWeek: lec.weekday.toUpperCase(),
            startTime: lec.startTime,
            endTime: lec.endTime,
            lectureType: (lec.lectureType?.toUpperCase() === 'LAB' || lec.lectureType?.toUpperCase() === 'PRACTICAL' || dbSub.name?.toLowerCase().includes('practical') || dbSub.name?.toLowerCase().includes('lab')) ? 'LAB' : lec.lectureType?.toUpperCase() === 'TUTORIAL' ? 'TUTORIAL' : 'THEORY',
            room: lec.room || null,
            repeatWeekly: lec.repeatWeekly !== false,
            subjectId: dbSub.id,
            facultyId: dbFacultyId
          }
        });
        lecturesCount++;
      }

      let holidaysCount = 0;
      for (const hol of holidays || []) {
        await tx.holiday.create({
          data: {
            title: hol.name || hol.title,
            date: new Date(hol.date),
            description: hol.description || null,
            semesterId: semester.id
          }
        });
        holidaysCount++;
      }

      return {
        semester,
        facultiesCount: Object.keys(facultyMap).length,
        subjectsCount: Object.keys(subjectsMap).length,
        lecturesCount,
        holidaysCount
      };
    }, {
      timeout: 25000
    });

    return res.status(201).json(new ApiResponse(201, result, 'Academic data imported successfully'));

  } catch (err) {
    console.error("Atomic import transaction block failed:", err);
    throw new ApiError(500, `Database transaction failed: ${err.message}`);
  }
});

export const getActiveSemester = asyncHandler(async (req, res) => {
  const userId = req.query.userId || 'default-user';

  const semester = await prisma.semester.findFirst({
    where: { userId },
    include: {
      faculties: true,
      holidays: true,
      subjects: {
        include: {
          lectures: {
            include: {
              faculty: true
            }
          },
          attendanceRecords: true
        }
      }
    }
  });

  if (!semester) {
    return res.status(200).json(new ApiResponse(200, null, 'No active semester configuration found'));
  }

  return res.status(200).json(new ApiResponse(200, semester, 'Active semester configuration retrieved successfully'));
});
