import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { importWorkbook } from '../services/import/importService.js';
import { ACADEMIC_TYPES } from '../services/import/typeResolver.js';

// Normalize any academic type string to a value the Prisma SubjectType/LectureType
// enums accept, defaulting safely to THEORY for anything unrecognized.
const toPrismaAcademicType = (value) => {
  const upper = String(value || '').trim().toUpperCase();
  return ACADEMIC_TYPES.includes(upper) ? upper : 'THEORY';
};

export const parseWorkbook = asyncHandler(async (req, res) => {
  const { file } = req.body;
  if (!file) {
    throw new ApiError(400, 'Excel file base64 data is required');
  }

  let result;
  try {
    result = importWorkbook(file);
  } catch (err) {
    throw new ApiError(400, err.message);
  }

  const message = result.errors.length > 0 ? 'Workbook validation failed' : 'Workbook parsed and validated successfully';
  return res.status(200).json(new ApiResponse(200, result, message));
});

export const confirmImport = asyncHandler(async (req, res) => {
  const { userId, semester, faculties, subjects, lectures, holidays } = req.body;
  if (!userId) {
    throw new ApiError(400, 'userId is required');
  }
  if (!semester || !semester.name || !semester.startDate || !semester.endDate) {
    throw new ApiError(400, 'Semester info (name, startDate, endDate) is required');
  }

  const startTimeStr = Date.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check user
      let user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        user = await tx.user.create({
          data: { id: userId, name: 'Jainam Davda' }
        });
      }

      // Clear existing records for this user (single-semester-at-a-time import model)
      const oldSemesters = await tx.semester.findMany({ where: { userId } });
      for (const sem of oldSemesters) {
        await tx.attendance.deleteMany({ where: { subject: { semesterId: sem.id } } });
        await tx.lecture.deleteMany({ where: { subject: { semesterId: sem.id } } });
        await tx.subject.deleteMany({ where: { semesterId: sem.id } });
        await tx.faculty.deleteMany({ where: { semesterId: sem.id } });
        await tx.holiday.deleteMany({ where: { semesterId: sem.id } });
        await tx.semester.delete({ where: { id: sem.id } });
      }

      // 1. Create Semester
      const createdSem = await tx.semester.create({
        data: {
          name: semester.name,
          academicYear: semester.academicYear || '2026-27',
          startDate: new Date(semester.startDate),
          endDate: new Date(semester.endDate),
          attendanceRequirement: parseInt(semester.attendanceRequirement || 75, 10),
          userId
        }
      });

      // 2. Create Faculty
      const facultyMap = {}; // lower-cased name -> created faculty row
      for (const fac of faculties || []) {
        const facClean = fac.name.trim().toLowerCase();
        if (facultyMap[facClean]) continue;

        const dbFac = await tx.faculty.create({
          data: {
            name: fac.name,
            department: fac.department || 'General Academics',
            email: fac.email || null,
            cabin: fac.cabin || null,
            designation: fac.designation || null,
            semesterId: createdSem.id
          }
        });
        facultyMap[facClean] = dbFac;
      }

      // 3. Create Subjects
      const subjectsMap = {}; // uppercased code -> created subject row
      for (const sub of subjects || []) {
        const codeUpper = sub.code.trim().toUpperCase();

        let facultyId = null;
        if (sub.facultyName) {
          const matchFac = facultyMap[sub.facultyName.trim().toLowerCase()];
          if (matchFac) facultyId = matchFac.id;
        }

        const dbSub = await tx.subject.create({
          data: {
            code: codeUpper,
            name: sub.name,
            type: toPrismaAcademicType(sub.type),
            credits: sub.credits ? parseInt(sub.credits, 10) : 3,
            facultyId,
            semesterId: createdSem.id
          }
        });
        subjectsMap[codeUpper] = dbSub;
      }

      // 4. Create Lectures
      let lecturesCount = 0;
      for (const lec of lectures || []) {
        const codeUpper = lec.subjectCode.trim().toUpperCase();
        const dbSub = subjectsMap[codeUpper];
        if (!dbSub) continue;

        let facultyId = dbSub.facultyId;
        if (lec.facultyName) {
          const matchFac = facultyMap[lec.facultyName.trim().toLowerCase()];
          if (matchFac) facultyId = matchFac.id;
        }

        await tx.lecture.create({
          data: {
            dayOfWeek: (lec.weekday || lec.day || '').toUpperCase(),
            startTime: lec.startTime,
            endTime: lec.endTime,
            lectureType: toPrismaAcademicType(lec.lectureType),
            room: lec.room || null,
            repeatWeekly: lec.repeatWeekly !== false,
            subjectId: dbSub.id,
            facultyId
          }
        });
        lecturesCount++;
      }

      // 5. Create Holidays
      let holidaysCount = 0;
      for (const hol of holidays || []) {
        await tx.holiday.create({
          data: {
            title: hol.name || hol.title || 'Holiday',
            date: new Date(hol.date),
            description: hol.description || null,
            semesterId: createdSem.id
          }
        });
        holidaysCount++;
      }

      const durationMs = Date.now() - startTimeStr;

      return {
        semesterImported: createdSem.name,
        facultyImportedCount: Object.keys(facultyMap).length,
        subjectsImportedCount: Object.keys(subjectsMap).length,
        lecturesImportedCount: lecturesCount,
        holidaysImportedCount: holidaysCount,
        totalRecords: 1 + Object.keys(facultyMap).length + Object.keys(subjectsMap).length + lecturesCount + holidaysCount,
        durationMs
      };
    }, {
      timeout: 25000
    });

    return res.status(201).json(new ApiResponse(201, result, 'Workbook transaction committed successfully'));

  } catch (err) {
    console.error('Confirmation import transaction block failed:', err);
    throw new ApiError(500, `Confirmation transaction failed: ${err.message}`);
  }
});
