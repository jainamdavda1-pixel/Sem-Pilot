import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { importWorkbook } from '../services/import/importService.js';
import { ACADEMIC_TYPES } from '../services/import/typeResolver.js';
import { NotificationService } from '../services/notification.service.js';

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

/**
 * Sync parsed assignments received from the browser extension
 */
export const importClassroomAssignments = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.body.userId || "default-user";
  const { assignments } = req.body;

  if (!Array.isArray(assignments)) {
    throw new ApiError(400, "Assignments payload must be an array");
  }

  // 1. Get user and semester info
  const activeSemester = await prisma.semester.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  if (!activeSemester) {
    throw new ApiError(400, "No active semester configured yet. Please complete wizard setup first.");
  }

  let newCount = 0;
  let updatedCount = 0;

  for (const item of assignments) {
    // 2. Resolve Course mapping
    let mapping = await prisma.googleCourseMapping.findFirst({
      where: { googleCourseId: item.googleCourseId, userId },
      include: { subject: true }
    });

    // Fallback: Auto-create mapping or subject if not mapped
    if (!mapping) {
      const courseNameClean = item.courseName || "Classroom Sync Course";
      
      // Look for subject with matching name
      let subject = await prisma.subject.findFirst({
        where: { name: { equals: courseNameClean, mode: "insensitive" }, semesterId: activeSemester.id }
      });

      // Dynamic subject creation if still missing
      if (!subject) {
        const generatedCode = courseNameClean.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 4) + Math.floor(100 + Math.random() * 900);
        subject = await prisma.subject.create({
          data: {
            code: generatedCode,
            name: courseNameClean,
            type: "THEORY",
            credits: 3,
            semesterId: activeSemester.id
          }
        });
      }

      // Create google mapping record
      mapping = await prisma.googleCourseMapping.create({
        data: {
          googleCourseId: item.googleCourseId,
          courseName: courseNameClean,
          subjectId: subject.id,
          userId
        },
        include: { subject: true }
      });
    }

    // 3. Resolve deadline timestamp
    const dueDate = parseScrapedDate(item.dueString);

    // 4. Save assignment record
    const existing = await prisma.assignment.findUnique({
      where: { googleAssignmentId: item.googleAssignmentId }
    });

    if (existing) {
      const hasChanged = 
        existing.status !== item.submissionStatus ||
        existing.title !== item.title ||
        existing.description !== item.description;

      if (hasChanged) {
        const isNewlyCompleted = existing.status !== "COMPLETED" && item.submissionStatus === "COMPLETED";

        await prisma.assignment.update({
          where: { id: existing.id },
          data: {
            title: item.title,
            description: item.description,
            status: item.submissionStatus,
            dueDate: dueDate || existing.dueDate,
            attachments: item.attachments || existing.attachments
          }
        });
        updatedCount++;

        // Send submission notification
        if (isNewlyCompleted) {
          await NotificationService.notify({
            userId,
            type: "ASSIGNMENT_SUBMITTED",
            title: "Classroom Assignment Submitted",
            message: `"${item.title}" for ${mapping.subject.name} has been marked as COMPLETED.`,
            metadata: {
              assignmentId: existing.id,
              title: item.title,
              subjectName: mapping.subject.name,
              subjectCode: mapping.subject.code,
              link: "/assignments"
            }
          }).catch(err => console.error(err));
        }
      }
    } else {
      const created = await prisma.assignment.create({
        data: {
          title: item.title,
          description: item.description || "",
          subjectId: mapping.subjectId,
          source: "GOOGLE",
          googleAssignmentId: item.googleAssignmentId,
          googleCourseId: item.googleCourseId,
          dueDate,
          priority: "MEDIUM",
          status: item.submissionStatus,
          submissionStatus: item.submissionStatus
        }
      });
      newCount++;

      // Send creation notification
      await NotificationService.notify({
        userId,
        type: "ASSIGNMENT_CREATED",
        title: "New Classroom Assignment",
        message: `"${item.title}" has been published in Google Classroom for ${mapping.subject.name}.`,
        metadata: {
          assignmentId: created.id,
          title: item.title,
          dueDate: dueDate ? dueDate.toISOString().split("T")[0] : null,
          subjectName: mapping.subject.name,
          subjectCode: mapping.subject.code,
          link: "/assignments"
        }
      }).catch(err => console.error(err));
    }
  }

  // Save history log safely
  if (prisma.syncHistory) {
    try {
      await prisma.syncHistory.create({
        data: {
          userId,
          device: req.headers["user-agent"] || "Chrome Extension",
          status: "SUCCESS",
          syncedAssignmentsCount: newCount + updatedCount,
          details: `New: ${newCount}, Updated: ${updatedCount}`
        }
      });
    } catch (err) {
      console.error("Failed to write SyncHistory log:", err);
    }
  } else {
    console.warn("⚠️ prisma.syncHistory model accessor is not initialized in Prisma Client.");
  }

  return res.status(200).json(
    new ApiResponse(
      200, 
      { newCount, updatedCount, total: newCount + updatedCount }, 
      "Extension assignments imported successfully"
    )
  );
});

/**
 * Map course definitions received from the extension
 */
export const importClassroomCourses = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.body.userId || "default-user";
  const { courses } = req.body;

  if (!Array.isArray(courses)) {
    throw new ApiError(400, "Courses payload must be an array");
  }

  const activeSemester = await prisma.semester.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  if (!activeSemester) {
    throw new ApiError(400, "No active semester configured yet. Please complete wizard setup first.");
  }

  let createdCount = 0;

  for (const course of courses) {
    const existing = await prisma.googleCourseMapping.findUnique({
      where: { googleCourseId: course.googleCourseId }
    });

    if (!existing) {
      // Find matching subject
      let subject = await prisma.subject.findFirst({
        where: { name: { equals: course.courseName, mode: "insensitive" }, semesterId: activeSemester.id }
      });

      if (!subject) {
        // Create matching subject dynamically
        const generatedCode = course.courseName.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 4) + Math.floor(100 + Math.random() * 900);
        subject = await prisma.subject.create({
          data: {
            code: generatedCode,
            name: course.courseName,
            type: "THEORY",
            credits: 3,
            semesterId: activeSemester.id
          }
        });
      }

      await prisma.googleCourseMapping.create({
        data: {
          googleCourseId: course.googleCourseId,
          courseName: course.courseName,
          subjectId: subject.id,
          userId
        }
      });
      createdCount++;
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { createdCount }, "Classroom courses synced successfully")
  );
});

/**
 * Retrieve sync history status logs for dashboard panels
 */
export const getSyncStatus = asyncHandler(async (req, res) => {
  const userId = req.query.userId || "default-user";

  const history = await prisma.syncHistory.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: 10
  });

  return res.status(200).json(
    new ApiResponse(200, history, "Sync status logs retrieved successfully")
  );
});

/**
 * Utility helper to parse scraped human dates (e.g. "Due Tomorrow, 11:59 PM")
 */
function parseScrapedDate(dateStr) {
  if (!dateStr || dateStr.toLowerCase().includes("no due date")) return null;

  const now = new Date();
  const lower = dateStr.toLowerCase();

  try {
    if (lower.includes("tomorrow")) {
      const tomorrow = new Date(now.setDate(now.getDate() + 1));
      tomorrow.setHours(23, 59, 0, 0);
      return tomorrow;
    }
    if (lower.includes("today")) {
      const today = new Date();
      today.setHours(23, 59, 0, 0);
      return today;
    }

    const clean = dateStr.replace(/(due|turned in|returned|graded|assigned|submitted)/gi, "").trim();
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) return parsed;
  } catch (err) {
    console.warn("Parser error resolving due text:", dateStr);
  }
  return null;
}
