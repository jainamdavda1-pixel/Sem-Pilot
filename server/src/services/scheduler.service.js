import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { NotificationService } from "./notification.service.js";
import { GoogleGenAI } from "@google/genai";

/**
 * Initialize all scheduled background tasks
 */
export function startNotificationScheduler() {
  console.log("⏰ Centralized Notification Scheduler starting...");

  // 1. Hourly check: Assignments due warnings (every hour, at minute 0)
  cron.schedule("0 * * * *", async () => {
    console.log("🕵️ Scheduler running: Hourly assignment deadline audits");
    try {
      await checkAssignmentsDeadlines();
    } catch (err) {
      console.error("❌ Scheduler error in assignment deadline audits:", err);
    }
  });

  // 2. Daily check at 8:00 AM: Today's schedule, assignment list, and exams countdown
  cron.schedule("0 8 * * *", async () => {
    console.log("🕵️ Scheduler running: Daily morning reminders (8:00 AM)");
    try {
      await sendDailyMorningReminders();
    } catch (err) {
      console.error("❌ Scheduler error in daily morning reminders:", err);
    }
  });

  // 3. Weekly Sunday Report at 7:00 PM: Weekly attendance summary & AI study plan
  cron.schedule("0 19 * * 0", async () => {
    console.log("🕵️ Scheduler running: Weekly Sunday academic digest (7:00 PM)");
    try {
      await generateWeeklyDigest();
    } catch (err) {
      console.error("❌ Scheduler error in weekly Sunday academic digest:", err);
    }
  });

  console.log("✅ All background cron jobs registered successfully.");
}

/**
 * Audit assignments and send alerts for deadlines approaching (3 days, tomorrow, today, overdue)
 */
export async function checkAssignmentsDeadlines() {
  const users = await prisma.user.findMany();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const user of users) {
    const assignments = await prisma.assignment.findMany({
      where: {
        subject: { semester: { userId: user.id } },
        status: { in: ["PENDING", "IN_PROGRESS"] }
      },
      include: { subject: true }
    });

    for (const ass of assignments) {
      if (!ass.dueDate) continue;

      const dueDateObj = new Date(ass.dueDate);
      dueDateObj.setHours(0, 0, 0, 0);

      const msDiff = dueDateObj.getTime() - today.getTime();
      const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24));

      let type = null;
      let title = "";
      let message = "";

      if (daysDiff === 3) {
        type = "ASSIGNMENT_DUE_3_DAYS";
        title = "Assignment due in 3 days";
        message = `"${ass.title}" for ${ass.subject.name} is due in 3 days.`;
      } else if (daysDiff === 1) {
        type = "ASSIGNMENT_DUE_TOMORROW";
        title = "Assignment due tomorrow";
        message = `"${ass.title}" for ${ass.subject.name} is due tomorrow.`;
      } else if (daysDiff === 0) {
        type = "ASSIGNMENT_DUE_TODAY";
        title = "Assignment due today";
        message = `⚠️ "${ass.title}" for ${ass.subject.name} is due today!`;
      } else if (daysDiff < 0) {
        type = "ASSIGNMENT_OVERDUE";
        title = "Assignment overdue";
        message = `🚨 "${ass.title}" for ${ass.subject.name} is overdue!`;
      }

      if (type) {
        await NotificationService.notify({
          userId: user.id,
          type,
          title,
          message,
          metadata: {
            assignmentId: ass.id,
            title: ass.title,
            priority: ass.priority,
            dueDate: dueDateObj.toISOString().split("T")[0],
            dueTime: ass.dueTime || "",
            subjectCode: ass.subject.code,
            subjectName: ass.subject.name,
            link: "/assignments",
            uniqueKey: `${type}-${ass.id}-${dueDateObj.toISOString().split("T")[0]}`
          }
        });
      }
    }
  }
}

/**
 * Morning daily report: Today's schedule and active exams countdown
 */
export async function sendDailyMorningReminders() {
  const users = await prisma.user.findMany();
  
  const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const todayIndex = new Date().getDay();
  const currentWeekday = weekdays[todayIndex];

  for (const user of users) {
    // 1. Timetable Schedule summary
    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id },
      include: {
        subjects: {
          include: {
            lectures: {
              where: { dayOfWeek: currentWeekday }
            }
          }
        }
      }
    });

    if (activeSemester) {
      const todayLectures = [];
      activeSemester.subjects.forEach(sub => {
        sub.lectures.forEach(l => {
          todayLectures.push({ subject: sub.name, time: l.startTime, type: l.lectureType, room: l.room || "N/A" });
        });
      });

      if (todayLectures.length > 0) {
        todayLectures.sort((a, b) => a.time.localeCompare(b.time));
        const listText = todayLectures.map(l => `- ${l.time}: ${l.subject} (${l.type}) in ${l.room}`).join("\n");

        await NotificationService.notify({
          userId: user.id,
          type: "TODAY_TIMETABLE_REMINDER",
          title: "Your classes for today",
          message: `You have ${todayLectures.length} class${todayLectures.length === 1 ? "" : "es"} scheduled today:\n${listText}`,
          metadata: {
            link: "/",
            uniqueKey: `timetable-today-${new Date().toISOString().split("T")[0]}`
          }
        });
      }
    }

    // 2. Active Exam milestones reminders (e.g. countdown to Midsem or Endsem dates)
    const holidaysAndDates = await prisma.holiday.findMany({
      where: {
        semester: { userId: user.id }
      }
    });

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (const event of holidaysAndDates) {
      const titleLower = event.title.toLowerCase();
      const isExam = titleLower.includes("exam") || titleLower.includes("midsem") || titleLower.includes("endsem");
      if (!isExam) continue;

      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      const diff = eventDate.getTime() - todayDate.getTime();
      const days = Math.round(diff / (1000 * 60 * 60 * 24));

      // Remind at 7 days, 3 days, and 1 day countdown thresholds
      if (days === 7 || days === 3 || days === 1) {
        const type = days === 7 ? "EXAM_COUNTDOWN_7_DAYS" : days === 3 ? "EXAM_COUNTDOWN_3_DAYS" : "EXAM_COUNTDOWN_1_DAY";
        
        // Fetch subjects for standard exam email list
        const activeSem = await prisma.semester.findFirst({
          where: { userId: user.id },
          include: { subjects: true }
        });

        await NotificationService.notify({
          userId: user.id,
          type,
          title: `Exam countdown: ${event.title} in ${days} day${days === 1 ? "" : "s"}!`,
          message: `Prepare your topics! "${event.title}" starts on ${event.date.toISOString().split("T")[0]}.`,
          metadata: {
            examName: event.title,
            daysRemaining: days,
            examDate: event.date.toISOString().split("T")[0],
            subjects: activeSem ? activeSem.subjects.map(s => ({ code: s.code, name: s.name, credits: s.credits || 3 })) : [],
            link: "/calendar",
            uniqueKey: `exam-${event.id}-${days}`
          }
        });
      }
    }
  }
}

/**
 * Weekly Sunday Digest: Compile subject logs and request Gemini to build study tips/feedback
 */
export async function generateWeeklyDigest() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    const semester = await prisma.semester.findFirst({
      where: { userId: user.id },
      include: {
        subjects: {
          include: {
            attendanceRecords: true,
            assignments: {
              where: { status: { in: ["PENDING", "IN_PROGRESS"] } }
            }
          }
        }
      }
    });

    if (!semester) continue;

    const targetGoal = semester.attendanceRequirement;
    const subjectsData = [];
    let warningCount = 0;
    const pendingAssignmentsList = [];

    semester.subjects.forEach(sub => {
      const records = sub.attendanceRecords || [];
      const present = records.filter(r => r.status === "PRESENT").length;
      const absent = records.filter(r => r.status === "ABSENT").length;
      const total = present + absent;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      let marginText = "";
      if (total === 0) {
        marginText = "No classes conducted yet.";
      } else {
        const maxSkip = Math.floor((present * 100 / targetGoal) - total);
        if (maxSkip >= 0) {
          marginText = `Safe to skip ${maxSkip} class${maxSkip === 1 ? "" : "es"}.`;
        } else {
          const needed = Math.ceil((targetGoal * total - 100 * present) / (100 - targetGoal));
          marginText = `Must attend next ${needed} consecutive class${needed === 1 ? "" : "es"}.`;
          warningCount++;
        }
      }

      subjectsData.push({
        name: sub.name,
        code: sub.code,
        present,
        absent,
        total,
        rate,
        margin: marginText
      });

      sub.assignments.forEach(ass => {
        pendingAssignmentsList.push({ title: ass.title, subject: sub.name, priority: ass.priority });
      });
    });

    // 1. Dispatch Weekly Attendance Report
    await NotificationService.notify({
      userId: user.id,
      type: "WEEKLY_ATTENDANCE_REPORT",
      title: "Weekly Attendance Summary",
      message: `Review your attendance. Target Goal: ${targetGoal}%. ${warningCount} subjects are currently below requirement limits.`,
      metadata: {
        targetGoal,
        warningCount,
        subjects: subjectsData,
        link: "/",
        uniqueKey: `weekly-attendance-${new Date().toISOString().split("T")[0]}`
      }
    });

    // 2. Generate and dispatch AI study plans/summaries using Gemini
    let aiSummaryText = `Hey Student! Continue working hard on your classes. 
Review your pending course tasks:
${pendingAssignmentsList.map(a => `- ${a.title} (${a.subject}) [${a.priority}]`).join("\n")}`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const subjectsSummary = subjectsData.map(s => `${s.name} (${s.code}): Rate: ${s.rate}%, Status: ${s.margin}`).join("\n");
        const tasksSummary = pendingAssignmentsList.map(a => `- ${a.title} (Subject: ${a.subject}) Priority: ${a.priority}`).join("\n");

        const prompt = `You are a supportive academic coach. Write a weekly brief study plan and motivative suggestions.
Student's Weekly Status:
- Minimum Target Goal: ${targetGoal}%
- Subject Attendance Status:
${subjectsSummary}
- Active Pending Tasks:
${tasksSummary}

Write a short, highly-encouraging 3-paragraph summary of their health, specific class skip safety recommendations, and which assignment to tackle first. Keep it bulleted and clean.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        if (response?.text) {
          aiSummaryText = response.text;
        }
      } catch (err) {
        console.error("Scheduler Gemini AI Summary generation failed:", err);
      }
    }

    await NotificationService.notify({
      userId: user.id,
      type: "WEEKLY_ACADEMIC_SUMMARY",
      title: "AI Weekly Digest & Recommendations",
      message: "Your personalized study plan and attendance strategy recommendations are ready.",
      metadata: {
        aiSummaryText,
        link: "/ai-assistant",
        uniqueKey: `weekly-ai-digest-${new Date().toISOString().split("T")[0]}`
      }
    });
  }
}
