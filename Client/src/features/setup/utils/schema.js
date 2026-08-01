import { z } from "zod";

// Helper to convert HH:MM time string to total minutes
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Step 1: Semester Info Schema
export const semesterInfoSchema = z.object({
  collegeName: z.string().min(1, "College name is required"),
  degree: z.string().min(1, "Degree name is required"),
  semester: z.string().min(1, "Semester is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  attendanceRequirement: z
    .number()
    .min(0, "Requirement must be at least 0%")
    .max(100, "Requirement cannot exceed 100%")
    .default(75),
  semesterStartDate: z.string().min(1, "Semester start date is required"),
  semesterEndDate: z.string().min(1, "Semester end date is required"),
}).refine((data) => {
  const start = new Date(data.semesterStartDate);
  const end = new Date(data.semesterEndDate);
  return end >= start;
}, {
  message: "Semester end date must be on or after start date",
  path: ["semesterEndDate"],
});

// Step 3: Reviewed Subject Item Schema (Extracted from Timetable)
export const subjectItemSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  facultyRating: z.number().min(1).max(5).default(3),
  facultyStrictness: z.enum(["low", "medium", "high"]).default("medium"),
  priority: z.enum(["very_high", "high", "medium", "low"]).default("medium"),
});

// Step 2: Timetable Entry Schema
export const timetableEntrySchema = z
  .object({
    day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
    slotIndex: z.number(), // Grid display slot index
    subjectName: z.string().min(1, "Subject name is required"),
    lectureType: z.enum(["Theory", "Lab"], {
      required_error: "Lecture type is required",
    }),
    facultyName: z.string().min(1, "Faculty name is required"),
    room: z.string().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine(
    (data) => {
      const start = timeToMinutes(data.startTime);
      const end = timeToMinutes(data.endTime);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

// Step 2 Container Schema with overlap validation
export const timetableSchema = z.object({
  timetableEntries: z
    .array(timetableEntrySchema)
    .default([])
    .refine(
      (entries) => {
        // Group entries by day
        const dayMap = {};
        for (const entry of entries) {
          if (!dayMap[entry.day]) {
            dayMap[entry.day] = [];
          }
          dayMap[entry.day].push(entry);
        }

        // Check each day for overlaps
        for (const day of Object.keys(dayMap)) {
          const dayEntries = dayMap[day];
          for (let i = 0; i < dayEntries.length; i++) {
            const e1 = dayEntries[i];
            const start1 = timeToMinutes(e1.startTime);
            const end1 = timeToMinutes(e1.endTime);

            for (let j = i + 1; j < dayEntries.length; j++) {
              const e2 = dayEntries[j];
              const start2 = timeToMinutes(e2.startTime);
              const end2 = timeToMinutes(e2.endTime);

              // Overlap condition: start1 < end2 AND start2 < end1
              if (start1 < end2 && start2 < end1) {
                return false; // Found an overlap
              }
            }
          }
        }
        return true;
      },
      {
        message: "Schedule contains overlapping lectures. Please resolve conflicts.",
      }
    ),
  timetableRepeats: z.boolean().default(true),
});

// Step 4: Academic Calendar Schema
export const calendarUploadSchema = z.object({
  calendarFile: z
    .object({
      name: z.string(),
      size: z.number(),
      type: z.string(),
      lastModified: z.number(),
    })
    .nullable()
    .default(null),
});

// Step 5: Important Dates Schema
export const importantDatesSchema = z.object({
  midsemStart: z.string().min(1, "Midsem start date is required"),
  midsemEnd: z.string().min(1, "Midsem end date is required"),
  endsemStart: z.string().min(1, "Endsem start date is required"),
  endsemEnd: z.string().min(1, "Endsem end date is required"),
  holidays: z
    .array(
      z.object({
        date: z.string().min(1, "Date is required"),
        name: z.string().min(1, "Holiday name is required"),
      })
    )
    .default([]),
}).refine((data) => {
  const midStart = new Date(data.midsemStart);
  const midEnd = new Date(data.midsemEnd);
  return midEnd >= midStart;
}, {
  message: "Midsem end date must be on or after start date",
  path: ["midsemEnd"],
}).refine((data) => {
  const endStart = new Date(data.endsemStart);
  const endEnd = new Date(data.endsemEnd);
  return endEnd >= endStart;
}, {
  message: "Endsem end date must be on or after start date",
  path: ["endsemEnd"],
});

// Step 6: Personal Preferences Schema
export const personalPreferencesSchema = z.object({
  prefMorning: z.enum(["love", "neutral", "dislike"]),
  prefEvening: z.enum(["love", "neutral", "dislike"]),
  prefLabs: z.enum(["love", "neutral", "dislike"]),
  prefMaxContinuous: z.enum(["2", "3", "4", "5+"]),
  prefAttendanceGoal: z.enum(["75%", "80%", "85%", "90%"]),
  prefStrategy: z.enum([
    "always_maintain",
    "build_buffer",
    "save_bunks",
    "balanced",
  ]),
});

// Global wizard schema
export const wizardSchema = z.object({
  semesterInfo: semesterInfoSchema,
  subjects: z.array(subjectItemSchema),
  timetableEntries: z.array(timetableEntrySchema),
  timetableRepeats: z.boolean(),
  hasSemesterStarted: z.enum(["No", "Yes"]).default("No"),
  pastLectures: z.array(z.object({
    id: z.string().optional(),
    date: z.string(),
    weekday: z.string(),
    subjectName: z.string(),
    lectureType: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    status: z.enum(["Present", "Absent", "Cancelled", "Holiday"]).nullable().optional(),
  })).default([]),
  calendarFile: calendarUploadSchema.shape.calendarFile,
  dates: importantDatesSchema,
  preferences: personalPreferencesSchema,
});
