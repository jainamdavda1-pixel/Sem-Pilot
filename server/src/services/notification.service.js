import { prisma } from "../lib/prisma.js";
import { sendPushNotification } from "./push.service.js";
import { sendEmailNotification } from "./email.service.js";
import { templates } from "./templates.js";

/**
 * Maps notification types to user preference keys
 */
const getPreferenceKeys = (type) => {
  const t = String(type || "").toUpperCase();

  if (t.startsWith("ASSIGNMENT")) {
    return { browserKey: "browserAssignments", emailKey: "emailAssignments" };
  }
  if (t.startsWith("ATTENDANCE") || t === "WEEKLY_ATTENDANCE_REPORT" || t === "MONTHLY_PERFORMANCE_REPORT") {
    return { browserKey: "browserAttendance", emailKey: "emailAttendance" };
  }
  if (t.includes("REMINDER") || t.includes("EXAM") || t.startsWith("MIDSEM") || t.startsWith("ENDSEM")) {
    return { browserKey: "browserExams", emailKey: "emailExams" };
  }
  if (t.includes("ANNOUNCEMENT") || t.includes("NOTICE") || t === "LECTURE_CANCELLED" || t === "TIMETABLE_UPDATED") {
    return { browserKey: "browserAnnouncements", emailKey: "emailAnnouncements" };
  }
  if (t.startsWith("AI") || t.includes("STUDY_PLAN") || t === "WEEKLY_ACADEMIC_SUMMARY" || t === "AI_RECOMMENDATIONS") {
    return { browserKey: "browserAI", emailKey: "emailAI" };
  }
  // System alerts are always enabled by default
  return { browserKey: null, emailKey: null };
};

/**
 * Resolve matching HTML template based on type and metadata
 */
const getEmailHtml = (type, title, message, metadata) => {
  const t = String(type || "").toUpperCase();

  try {
    if (t.startsWith("ASSIGNMENT") && metadata?.title) {
      return templates.assignmentReminder({
        subjectCode: metadata.subjectCode || "GEN101",
        subjectName: metadata.subjectName || "Coursework",
        title: metadata.title,
        priority: metadata.priority || "MEDIUM",
        description: metadata.description || message,
        dueDate: metadata.dueDate || "Tomorrow",
        dueTime: metadata.dueTime || ""
      });
    }

    if (t === "WEEKLY_ATTENDANCE_REPORT" && metadata?.subjects) {
      return templates.weeklyAttendanceReport({
        targetGoal: metadata.targetGoal || 75,
        subjects: metadata.subjects,
        warningCount: metadata.warningCount || 0
      });
    }

    if (t === "MONTHLY_PERFORMANCE_REPORT" && metadata?.subjects) {
      return templates.monthlyPerformanceReport({
        overallRate: metadata.overallRate || 0,
        completedCount: metadata.completedCount || 0,
        subjects: metadata.subjects,
        target: metadata.target || 75
      });
    }

    if ((t.startsWith("MIDSEM") || t.startsWith("ENDSEM") || t.includes("EXAM")) && metadata?.examName) {
      return templates.examReminder({
        examName: metadata.examName,
        daysRemaining: metadata.daysRemaining || 7,
        examDate: metadata.examDate || "",
        subjects: metadata.subjects || []
      });
    }

    if (t === "WEEKLY_ACADEMIC_SUMMARY" && metadata?.aiSummaryText) {
      return templates.aiWeeklySummary({
        aiSummaryText: metadata.aiSummaryText
      });
    }

    if (t.startsWith("FACULTY") || t.startsWith("COLLEGE") || t === "ANNOUNCEMENT") {
      return templates.collegeAnnouncement({
        title: metadata?.title || title,
        publisher: metadata?.publisher || "Academic Office",
        message: metadata?.message || message
      });
    }
  } catch (err) {
    console.error("Failed to build HTML email using template:", err);
  }

  // Fallback default simple HTML card
  return `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px;">
      <h2 style="color: #4F46E5; margin-top: 0;">${title}</h2>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">${message}</p>
      <a href="https://semesterpilot.vercel.app/" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 12px; margin-top: 10px;">Go to SemPilot</a>
    </div>
  `;
};

export const NotificationService = {
  /**
   * Centralized dispatch point for any notifications
   */
  notify: async ({ userId, type, title, message, metadata = {} }) => {
    console.log(`🔔 Received Notification request for User: ${userId}, Type: ${type}`);

    // 1. Prevent duplicate logs within the last 1 hour
    const uniqueKey = metadata?.uniqueKey || `${type}-${metadata?.assignmentId || metadata?.lectureId || "generic"}`;
    const oneHourAgo = new Date(Date.now() - 3600000);
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        createdAt: { gte: oneHourAgo },
        metadata: {
          path: ["uniqueKey"],
          equals: uniqueKey
        }
      }
    });

    if (existing) {
      console.warn(`🛑 Duplicate notification suppressed: ${uniqueKey}`);
      return existing;
    }

    // 2. Load User Preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId }
      });
    }

    // 3. Resolve enable channels
    const { browserKey, emailKey } = getPreferenceKeys(type);
    const globalEnabled = preferences.globalEnabled;

    const shouldSendBrowser = globalEnabled && (!browserKey || preferences[browserKey]);
    const shouldSendEmail = globalEnabled && (!emailKey || preferences[emailKey]);

    // Store custom uniqueKey in metadata for duplicates mapping checks
    const finalMetadata = { ...metadata, uniqueKey };

    // 4. Save notification log to Postgres Database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: finalMetadata,
        isRead: false,
        browserSent: false,
        emailSent: false
      }
    });

    // 5. Trigger Browser Push Notification (Async)
    if (shouldSendBrowser) {
      sendPushNotification(userId, {
        notificationId: notification.id,
        title,
        body: message,
        data: {
          url: metadata?.link || "/"
        }
      }).then(async (pushResult) => {
        if (pushResult?.success) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: { browserSent: true }
          }).catch(() => {});
        }
      }).catch(err => {
        console.error("Web Push failed in background:", err);
      });
    }

    // 6. Trigger Email Dispatch (Async)
    if (shouldSendEmail) {
      prisma.user.findUnique({ where: { id: userId } }).then(async (user) => {
        const targetEmail = user?.email || user?.googleEmail;
        if (targetEmail) {
          const htmlBody = getEmailHtml(type, title, message, finalMetadata);
          const emailResult = await sendEmailNotification(targetEmail, title, htmlBody);
          if (emailResult.success) {
            await prisma.notification.update({
              where: { id: notification.id },
              data: { emailSent: true }
            }).catch(() => {});
          }
        } else {
          console.warn(`⚠️ User ${userId} has no registered email. Skipping email dispatch.`);
        }
      }).catch(err => {
        console.error("Email dispatch failed in background:", err);
      });
    }

    return notification;
  }
};
