import { google } from "googleapis";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../lib/prisma.js";

// Helper to check if Google credentials are configured
const isGoogleConfigured = () => {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

// Instantiate real oauth client
const getOAuth2Client = (user) => {
  if (!isGoogleConfigured()) return null;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/google-callback";
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  oauth2.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry?.getTime()
  });
  return oauth2;
};

/**
 * Fetch all assignments for user (Google + Manual combined)
 */
export const getAssignments = asyncHandler(async (req, res) => {
  const userId = req.query.userId || "default-user";

  const assignments = await prisma.assignment.findMany({
    where: {
      subject: {
        semester: {
          userId
        }
      },
      status: {
        not: "DELETED"
      }
    },
    include: {
      subject: true
    },
    orderBy: [
      { dueDate: "asc" },
      { dueTime: "asc" }
    ]
  });

  return res.status(200).json(
    new ApiResponse(200, assignments, "Assignments fetched successfully")
  );
});

/**
 * Create a manual assignment
 */
export const createAssignment = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    subjectId,
    dueDate,
    dueTime,
    maxMarks,
    priority,
    status,
    attachments,
    notes
  } = req.body;

  if (!title || !subjectId) {
    throw new ApiError(400, "Title and Subject ID are required");
  }

  const assignment = await prisma.assignment.create({
    data: {
      title,
      description,
      subjectId,
      source: "MANUAL",
      dueDate: dueDate ? new Date(dueDate) : null,
      dueTime: dueTime || null,
      maxMarks: maxMarks ? parseFloat(maxMarks) : null,
      priority: priority || "MEDIUM",
      status: status || "PENDING",
      attachments: attachments || null,
      notes: notes || null
    },
    include: {
      subject: true
    }
  });

  return res.status(201).json(
    new ApiResponse(201, assignment, "Manual assignment created successfully")
  );
});

/**
 * Update an assignment (local status, notes, priority, etc.)
 */
export const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    dueDate,
    dueTime,
    maxMarks,
    priority,
    status,
    notes,
    attachments
  } = req.body;

  const existing = await prisma.assignment.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new ApiError(404, "Assignment not found");
  }

  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (dueTime !== undefined) data.dueTime = dueTime;
  if (maxMarks !== undefined) data.maxMarks = maxMarks ? parseFloat(maxMarks) : null;
  if (priority !== undefined) data.priority = priority;
  if (status !== undefined) {
    data.status = status;
    if (status === "COMPLETED" || status === "SUBMITTED") {
      data.completedAt = new Date();
    } else {
      data.completedAt = null;
    }
  }
  if (notes !== undefined) data.notes = notes;
  if (attachments !== undefined) data.attachments = attachments;

  const updated = await prisma.assignment.update({
    where: { id },
    data,
    include: {
      subject: true
    }
  });

  return res.status(200).json(
    new ApiResponse(200, updated, "Assignment updated successfully")
  );
});

/**
 * Delete / Soft-Delete Assignment
 */
export const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.assignment.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new ApiError(404, "Assignment not found");
  }

  if (existing.source === "GOOGLE") {
    // Soft delete for Google Classrooms assignments
    await prisma.assignment.update({
      where: { id },
      data: { status: "DELETED" }
    });
  } else {
    // Hard delete manual ones
    await prisma.assignment.delete({
      where: { id }
    });
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Assignment deleted successfully")
  );
});

/**
 * Synchronize Google Classroom Assignments
 */
export const syncGoogleClassroom = asyncHandler(async (req, res) => {
  const userId = req.query.userId || "default-user";

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !user.googleAccessToken) {
    throw new ApiError(401, "Google Classroom not connected");
  }

  // Get active course mappings
  const mappings = await prisma.googleCourseMapping.findMany({
    where: { userId }
  });

  if (mappings.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, { syncedCount: 0 }, "No course mappings configured. Connect coursework first.")
    );
  }

  let fetchedCoursework = [];

  if (user.googleAccessToken === "mock_sandbox_access_token") {
    // Sandbox / Mock Coursework list
    const mockAssignments = [
      {
        id: "ga1",
        courseId: "c1",
        title: "Calculus Limits Homework",
        description: "Complete exercises 1 through 15 in Chapter 2. Show all work.",
        maxPoints: 100,
        dueDate: { year: 2026, month: 8, day: 3 },
        dueTime: { hours: 23, minutes: 59 },
        state: "PUBLISHED",
        submissionState: "NEW"
      },
      {
        id: "ga2",
        courseId: "c1",
        title: "Derivatives Practical Lab",
        description: "Submit python logs mapping rate equations to slope gradients.",
        maxPoints: 50,
        dueDate: { year: 2026, month: 8, day: 8 },
        dueTime: { hours: 14, minutes: 0 },
        state: "PUBLISHED",
        submissionState: "TURNED_IN"
      },
      {
        id: "ga3",
        courseId: "c2",
        title: "Electromagnetism Quiz 1",
        description: "Online test covers Gauss Law and Flux lines.",
        maxPoints: 30,
        dueDate: { year: 2026, month: 8, day: 2 },
        dueTime: { hours: 9, minutes: 30 },
        state: "PUBLISHED",
        submissionState: "NEW"
      },
      {
        id: "ga4",
        courseId: "c3",
        title: "Red-Black Tree Coding Assignment",
        description: "Code a balanced search tree in Java. Implement insert and rotate functions.",
        maxPoints: 150,
        dueDate: { year: 2026, month: 8, day: 6 },
        dueTime: { hours: 23, minutes: 59 },
        state: "PUBLISHED",
        submissionState: "NEW"
      },
      {
        id: "ga5",
        courseId: "c3",
        title: "Big O Analysis Worksheet",
        description: "Derive space and time complexities of various sorting functions.",
        maxPoints: 10,
        dueDate: { year: 2026, month: 7, day: 30 }, // Missed
        dueTime: { hours: 12, minutes: 0 },
        state: "PUBLISHED",
        submissionState: "NEW"
      }
    ];

    fetchedCoursework = mockAssignments;
  } else {
    // Real API coursework syncer
    const oauth2 = getOAuth2Client(user);
    const tokenExpiryTime = user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() : 0;
    const isExpiring = tokenExpiryTime - Date.now() < 5 * 60 * 1000;
    if (isExpiring) {
      const refreshed = await oauth2.refreshAccessToken();
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: refreshed.credentials.access_token,
          googleTokenExpiry: refreshed.credentials.expiry_date ? new Date(refreshed.credentials.expiry_date) : null
        }
      });
    }

    const classroom = google.classroom({ version: "v1", auth: oauth2 });

    // Loop through each course mapping and fetch details
    for (const map of mappings) {
      try {
        const response = await classroom.courses.courseWork.list({
          courseId: map.googleCourseId
        });
        const list = response.data.courseWork || [];

        // Fetch submission status
        const subResponse = await classroom.courses.courseWork.studentSubmissions.list({
          courseId: map.googleCourseId,
          courseWorkId: "-"
        });
        const submissions = subResponse.data.studentSubmissions || [];

        list.forEach((cw) => {
          // Find matching submission
          const sub = submissions.find((s) => s.courseWorkId === cw.id);
          fetchedCoursework.push({
            id: cw.id,
            courseId: map.googleCourseId,
            title: cw.title,
            description: cw.description || "",
            maxPoints: cw.maxPoints || null,
            dueDate: cw.dueDate || null,
            dueTime: cw.dueTime || null,
            state: cw.state || "PUBLISHED",
            submissionState: sub ? sub.state : "NEW"
          });
        });
      } catch (err) {
        console.error(`Error fetching coursework for course ${map.googleCourseId}:`, err);
      }
    }
  }

  // Sync coursework records into Database
  let syncedCount = 0;
  const activeFetchedIds = new Set();

  for (const cw of fetchedCoursework) {
    activeFetchedIds.add(cw.id);
    const map = mappings.find((m) => m.googleCourseId === cw.courseId);
    if (!map) continue;

    // Standardize due date
    let dueDateObj = null;
    if (cw.dueDate) {
      dueDateObj = new Date(
        Date.UTC(cw.dueDate.year, cw.dueDate.month - 1, cw.dueDate.day)
      );
    }

    let dueTimeStr = null;
    if (cw.dueTime) {
      dueTimeStr = `${String(cw.dueTime.hours || 0).padStart(2, "0")}:${String(
        cw.dueTime.minutes || 0
      ).padStart(2, "0")}`;
    }

    // Determine status
    let status = "PENDING";
    if (cw.submissionState === "TURNED_IN" || cw.submissionState === "RETURNED") {
      status = "COMPLETED";
    } else if (dueDateObj && new Date() > dueDateObj) {
      status = "OVERDUE";
    }

    const existingAss = await prisma.assignment.findUnique({
      where: { googleAssignmentId: cw.id }
    });

    if (existingAss) {
      // Check for updates
      const hasChanged =
        existingAss.title !== cw.title ||
        existingAss.description !== cw.description ||
        (existingAss.maxMarks !== cw.maxPoints && cw.maxPoints !== null) ||
        (existingAss.dueDate && dueDateObj && existingAss.dueDate.getTime() !== dueDateObj.getTime());

      if (hasChanged) {
        await prisma.assignment.update({
          where: { googleAssignmentId: cw.id },
          data: {
            title: cw.title,
            description: cw.description,
            dueDate: dueDateObj,
            dueTime: dueTimeStr,
            maxMarks: cw.maxPoints ? parseFloat(cw.maxPoints) : null,
            submissionStatus: cw.submissionState,
            // Keep local status if manually overridden, otherwise update
            status: existingAss.status === "COMPLETED" ? "COMPLETED" : status
          }
        });
        syncedCount++;
      }
    } else {
      // Create new one
      await prisma.assignment.create({
        data: {
          title: cw.title,
          description: cw.description,
          subjectId: map.subjectId,
          source: "GOOGLE",
          googleAssignmentId: cw.id,
          googleCourseId: cw.courseId,
          dueDate: dueDateObj,
          dueTime: dueTimeStr,
          maxMarks: cw.maxPoints ? parseFloat(cw.maxPoints) : null,
          priority: "MEDIUM",
          status,
          submissionStatus: cw.submissionState
        }
      });
      syncedCount++;
    }
  }

  // Soft Delete Detection: Check for local GOOGLE assignments not in Google list
  const googleAssInDb = await prisma.assignment.findMany({
    where: {
      source: "GOOGLE",
      subject: {
        semester: {
          userId
        }
      }
    }
  });

  for (const ass of googleAssInDb) {
    if (ass.googleAssignmentId && !activeFetchedIds.has(ass.googleAssignmentId)) {
      // Soft delete
      await prisma.assignment.update({
        where: { id: ass.id },
        data: { status: "DELETED" }
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { syncedCount }, "Classroom synchronization complete")
  );
});
