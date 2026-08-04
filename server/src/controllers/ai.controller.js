import { GoogleGenAI } from "@google/genai";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Handle AI Copilot Chat requests with loaded database context
 */
export const chatWithAI = asyncHandler(async (req, res) => {
  const { messages } = req.body;
  const userId = req.query.userId || "default-user";

  if (!messages || !Array.isArray(messages)) {
    throw new ApiError(400, "Messages array is required in request body");
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json(
      new ApiResponse(200, {
        text: "AI Copilot setup incomplete: The GEMINI_API_KEY environment variable is not configured on the server. Please set it in your environment to enable AI chat."
      }, "Gemini API key is not configured")
    );
  }

  // 1. Fetch User and Active Semester Context
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  const semester = await prisma.semester.findFirst({
    where: { userId },
    include: {
      holidays: true,
      subjects: {
        include: {
          lectures: {
            include: { faculty: true }
          },
          attendanceRecords: true
        }
      }
    }
  });

  const assignments = await prisma.assignment.findMany({
    where: {
      subject: {
        semester: {
          userId
        }
      }
    },
    include: {
      subject: true
    }
  });

  // 2. Build detailed text context
  let contextText = "Semester Setup: Not completed yet. Prompt the student to import their syllabus or set up their classes.";
  
  if (semester) {
    const holidaysText = semester.holidays.length > 0
      ? semester.holidays.map(h => `- ${h.title} on ${h.date.toISOString().split("T")[0]}${h.description ? ` (${h.description})` : ""}`).join("\n")
      : "No holidays logged.";

    const subjectsText = semester.subjects.map(sub => {
      const records = sub.attendanceRecords || [];
      const present = records.filter(r => r.status === "PRESENT").length;
      const absent = records.filter(r => r.status === "ABSENT").length;
      const total = present + absent;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      
      let priorityLabel = "Medium";
      if (sub.subjectPriority === 5) priorityLabel = "Very High";
      else if (sub.subjectPriority === 4) priorityLabel = "High";
      else if (sub.subjectPriority === 2) priorityLabel = "Low";

      return `- Subject: ${sub.name} (${sub.code})
  Credits: ${sub.credits || 3}
  Difficulty: ${sub.difficulty || "Medium"}
  Priority Strictness: ${priorityLabel}
  Attendance Rate: ${rate}% (${present} Present, ${absent} Absent, Total Conducted: ${total})
  Required Target: ${semester.attendanceRequirement}%`;
    }).join("\n\n");

    const dayNameMapping = {
      MONDAY: "Monday",
      TUESDAY: "Tuesday",
      WEDNESDAY: "Wednesday",
      THURSDAY: "Thursday",
      FRIDAY: "Friday",
      SATURDAY: "Saturday",
      SUNDAY: "Sunday"
    };

    const timetableList = [];
    semester.subjects.forEach(sub => {
      sub.lectures.forEach(lec => {
        timetableList.push({
          day: dayNameMapping[lec.dayOfWeek] || "Monday",
          subject: sub.name,
          time: `${lec.startTime} - ${lec.endTime}`,
          type: lec.lectureType,
          room: lec.room || "N/A",
          faculty: lec.faculty?.name || "N/A"
        });
      });
    });

    const timetableText = timetableList.length > 0
      ? timetableList.map(t => `- ${t.day}: ${t.subject} (${t.type}) at ${t.time} in Room ${t.room} (Faculty: ${t.faculty})`).join("\n")
      : "No weekly timetable classes set up.";

    const assignmentsText = assignments.length > 0
      ? assignments.map(a => {
          const due = a.dueDate ? a.dueDate.toISOString().split("T")[0] : "N/A";
          return `- Task: ${a.title} (Subject: ${a.subject?.name || "N/A"})
  Due Date: ${due} ${a.dueTime || ""}
  Priority: ${a.priority}
  Status: ${a.status}
  Marks Weight: ${a.maxMarks || "N/A"}
  Notes: ${a.notes || "None"}`;
        }).join("\n\n")
      : "No assignments or exams recorded.";

    contextText = `
Student profile: ${user?.name || "Student"}
Semester Name: ${semester.name} (Academic Year: ${semester.academicYear})
Active Semester Range: ${semester.startDate.toISOString().split("T")[0]} to ${semester.endDate.toISOString().split("T")[0]}
Attendance Goal Requirement: ${semester.attendanceRequirement}%

Academic Subjects & Attendance Status:
${subjectsText}

Timetable Weekly Schedule:
${timetableText}

Assignments & Exams:
${assignmentsText}

Holidays:
${holidaysText}
`;
  }

  const systemInstruction = `You are "SemPilot Copilot AI", a brilliant, supportive, and motivating academic advisor and tutor.
Your goal is to help the student succeed by providing personalized study advice, calculating skip attendance safety margins accurately, building study timelines, and prioritizing assignments.

Here is the student's real-time academic context loaded from their PostgreSQL database:
-------------------------------------------
${contextText}
-------------------------------------------

Guidelines:
1. Always refer to the student by their name if available.
2. Be concise, motivating, and friendly. Provide clear, actionable bullet points or clean markdown tables where appropriate.
3. Be careful with calculations:
   - For skipping classes: check how skipping 1 or 2 classes affects the attendance rate.
   - For example: if they have conducted 4 classes and attended 4 (100%), they can skip 1 class because it will make it 3/5 = 60%, which is below a 75% target! So they cannot skip even 1.
4. Encourage them to sync with Google Classroom or import Excel sheets if they ask about missing data.
5. Offer to create custom study plans or revision schedules based on their subjects and upcoming assignments.
`;

  // 3. Connect to Google Gen AI Client
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content || m.text }]
      })),
      config: {
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      }
    });

    return res.status(200).json(
      new ApiResponse(200, {
        text: response.text
      }, "AI response generated successfully")
    );
  } catch (apiErr) {
    console.error("Gemini API Error:", apiErr);
    throw new ApiError(500, `Failed to fetch response from Gemini AI: ${apiErr.message}`);
  }
});
