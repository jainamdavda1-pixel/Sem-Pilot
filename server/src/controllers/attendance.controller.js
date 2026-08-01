import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { AttendanceService } from '../services/attendance.service.js';
import { prisma } from '../lib/prisma.js';

const attendanceService = new AttendanceService();

export const getAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const attendance = await attendanceService.getAttendanceById(id);
  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }
  return res.status(200).json(new ApiResponse(200, attendance, 'Attendance record fetched successfully'));
});

export const getSubjectAttendance = asyncHandler(async (req, res) => {
  const { subjectId } = req.query;
  if (!subjectId) {
    throw new ApiError(400, 'subjectId query parameter is required');
  }
  const records = await attendanceService.getSubjectAttendance(subjectId);
  return res.status(200).json(new ApiResponse(200, records, 'Attendance records fetched successfully'));
});

export const recordAttendance = asyncHandler(async (req, res) => {
  const { lectureDate, status, remarks, lectureId, subjectId } = req.body;

  if (!lectureDate || !status || !lectureId || !subjectId) {
    throw new ApiError(400, 'lectureDate, status (PRESENT/ABSENT/etc.), lectureId, and subjectId are required');
  }

  const attendance = await attendanceService.recordAttendance({
    lectureDate: new Date(lectureDate),
    status,
    lectureId,
    subjectId,
    remarks
  });

  return res.status(201).json(new ApiResponse(201, attendance, 'Attendance recorded successfully'));
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { lectureDate, status, remarks } = req.body;

  const updateData = {};
  if (lectureDate) updateData.lectureDate = new Date(lectureDate);
  if (status) updateData.status = status;
  if (remarks !== undefined) updateData.remarks = remarks;

  const attendance = await attendanceService.updateAttendance(id, updateData);
  return res.status(200).json(new ApiResponse(200, attendance, 'Attendance updated successfully'));
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await attendanceService.deleteAttendance(id);
  return res.status(200).json(new ApiResponse(200, null, 'Attendance deleted successfully'));
});

export const syncAttendance = asyncHandler(async (req, res) => {
  const { logs, userId } = req.body;
  if (!Array.isArray(logs)) {
    throw new ApiError(400, 'logs array is required');
  }

  const resolvedUserId = userId || 'default-user';
  const results = [];
  
  // 1. Fetch user semester
  const semester = await prisma.semester.findFirst({
    where: { userId: resolvedUserId },
    include: { subjects: { include: { lectures: true } } }
  });

  if (!semester) {
    throw new ApiError(404, 'Active semester not found for user');
  }

  // 2. Iterate through logs and upsert records
  for (const log of logs) {
    const { date, subjectName, lectureType, startTime, endTime, status } = log;
    if (!date || !subjectName || !status) continue;

    // Find subject matching name
    let subject = semester.subjects.find(
      s => s.name.trim().toLowerCase() === subjectName.trim().toLowerCase()
    );

    // If subject doesn't exist, create it dynamically under this semester
    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          name: subjectName,
          code: `${subjectName.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          type: (lectureType?.toLowerCase() === 'lab' || lectureType?.toLowerCase() === 'practical') ? 'LAB' : 'THEORY',
          semesterId: semester.id
        },
        include: { lectures: true }
      });
      // Add to our list to prevent recreating
      semester.subjects.push(subject);
    }

    // Determine Day of Week for the date
    const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const logDate = new Date(date);
    const dayName = weekdays[logDate.getDay()];

    // Find matching lecture slot
    let lecture = subject.lectures.find(
      l => l.startTime === startTime && l.dayOfWeek === dayName
    );

    // If lecture doesn't exist, create it dynamically
    if (!lecture) {
      lecture = await prisma.lecture.create({
        data: {
          dayOfWeek: dayName,
          startTime: startTime || "09:00",
          endTime: endTime || "10:00",
          lectureType: (lectureType?.toLowerCase() === 'lab' || lectureType?.toLowerCase() === 'practical') ? 'LAB' : 'THEORY',
          subjectId: subject.id
        }
      });
      subject.lectures.push(lecture);
    }

    // Map status string to DB Enum
    let dbStatus = "PRESENT";
    if (status.toLowerCase() === "absent") dbStatus = "ABSENT";
    else if (status.toLowerCase() === "cancelled") dbStatus = "CANCELLED";
    else if (status.toLowerCase() === "holiday") dbStatus = "HOLIDAY";

    // Upsert attendance record matching lectureDate, subjectId, and lectureId
    const existingRecord = await prisma.attendance.findFirst({
      where: {
        lectureId: lecture.id,
        lectureDate: new Date(date)
      }
    });

    if (existingRecord) {
      const updated = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: { status: dbStatus }
      });
      results.push(updated);
    } else {
      const created = await prisma.attendance.create({
        data: {
          lectureDate: new Date(date),
          status: dbStatus,
          lectureId: lecture.id,
          subjectId: subject.id
        }
      });
      results.push(created);
    }
  }

  return res.status(200).json(new ApiResponse(200, { count: results.length }, 'Attendance logs synced successfully'));
});
