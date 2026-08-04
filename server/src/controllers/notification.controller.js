import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getVapidPublicKey } from "../services/push.service.js";

/**
 * Fetch paginated, filtered notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.query.userId || "default-user";
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "15", 10);
  const unreadOnly = req.query.unreadOnly === "true";
  const search = req.query.search || "";
  const category = req.query.category || "all"; // all | assignments | attendance | exams | announcements | ai | system

  const skip = (page - 1) * limit;

  // Build prisma filter query clauses
  const whereClause = { userId };

  if (unreadOnly) {
    whereClause.isRead = false;
  }

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } }
    ];
  }

  // Filter types based on category mapping definitions
  if (category !== "all") {
    const cat = category.toUpperCase();
    if (cat === "ASSIGNMENTS") {
      whereClause.type = { startsWith: "ASSIGNMENT" };
    } else if (cat === "ATTENDANCE") {
      whereClause.type = { in: ["ATTENDANCE_BELOW_THRESHOLD", "ATTENDANCE_IMPROVED", "WEEKLY_ATTENDANCE_REPORT", "MONTHLY_PERFORMANCE_REPORT"] };
    } else if (cat === "EXAMS") {
      whereClause.type = { in: ["MIDSEM_REMINDER", "ENDSEM_REMINDER"] };
      // Fallback for countdown type alerts
      if (!whereClause.type) {
        whereClause.type = { contains: "EXAM" };
      }
    } else if (cat === "ANNOUNCEMENTS") {
      whereClause.type = { in: ["FACULTY_ANNOUNCEMENT", "COLLEGE_NOTICE", "LECTURE_CANCELLED", "TIMETABLE_UPDATED"] };
    } else if (cat === "AI") {
      whereClause.type = { in: ["WEEKLY_STUDY_PLAN", "WEEKLY_ACADEMIC_SUMMARY", "AI_RECOMMENDATIONS"] };
    } else if (cat === "SYSTEM") {
      whereClause.type = { in: ["WELCOME_NOTIFICATION", "ACCOUNT_UPDATES"] };
    }
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.notification.count({ where: whereClause })
  ]);

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        unreadCount
      },
      "Notifications fetched successfully"
    )
  );
});

/**
 * Mark single notification as read
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id }
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });

  return res.status(200).json(
    new ApiResponse(200, updated, "Notification marked as read")
  );
});

/**
 * Mark all notifications as read for a specific user
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.body.userId || "default-user";

  const updated = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });

  return res.status(200).json(
    new ApiResponse(200, { count: updated.count }, "All notifications marked as read")
  );
});

/**
 * Save user browser push subscription endpoint
 */
export const savePushSubscription = asyncHandler(async (req, res) => {
  const { subscription } = req.body;
  const userId = req.query.userId || "default-user";

  if (!subscription || !subscription.endpoint) {
    throw new ApiError(400, "Valid subscription object is required");
  }

  // Check if endpoint exists, updates keys or creates a new entry
  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: subscription.endpoint }
  });

  let saved;
  const serializedKeys = JSON.stringify(subscription.keys || {});

  if (existing) {
    saved = await prisma.pushSubscription.update({
      where: { endpoint: subscription.endpoint },
      data: {
        userId,
        expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null,
        keys: serializedKeys
      }
    });
  } else {
    saved = await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null,
        keys: serializedKeys
      }
    });
  }

  return res.status(200).json(
    new ApiResponse(200, saved, "Browser push subscription registered successfully")
  );
});

/**
 * Retrieve VAPID Public Key for subscription registrations
 */
export const getPublicKey = asyncHandler(async (req, res) => {
  const key = getVapidPublicKey();
  return res.status(200).json(
    new ApiResponse(200, { publicKey: key }, "VAPID Public Key retrieved")
  );
});

/**
 * Get notification preferences
 */
export const getPreferences = asyncHandler(async (req, res) => {
  const userId = req.query.userId || "default-user";

  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId }
  });

  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: { userId }
    });
  }

  return res.status(200).json(
    new ApiResponse(200, preferences, "Notification preferences retrieved")
  );
});

/**
 * Update user preferences toggles
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.query.userId || "default-user";
  const data = req.body;

  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId }
  });

  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: { userId }
    });
  }

  const updated = await prisma.notificationPreference.update({
    where: { userId },
    data: {
      globalEnabled: data.globalEnabled ?? preferences.globalEnabled,
      browserAssignments: data.browserAssignments ?? preferences.browserAssignments,
      browserAttendance: data.browserAttendance ?? preferences.browserAttendance,
      browserExams: data.browserExams ?? preferences.browserExams,
      browserAnnouncements: data.browserAnnouncements ?? preferences.browserAnnouncements,
      browserAI: data.browserAI ?? preferences.browserAI,
      emailAssignments: data.emailAssignments ?? preferences.emailAssignments,
      emailAttendance: data.emailAttendance ?? preferences.emailAttendance,
      emailExams: data.emailExams ?? preferences.emailExams,
      emailAI: data.emailAI ?? preferences.emailAI,
      emailAnnouncements: data.emailAnnouncements ?? preferences.emailAnnouncements
    }
  });

  return res.status(200).json(
    new ApiResponse(200, updated, "Notification preferences updated successfully")
  );
});
