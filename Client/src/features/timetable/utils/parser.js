import * as XLSX from "xlsx";

// Helper: Convert time string (HH:MM) to total minutes
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  // Handle Excel serial times (e.g. 0.375 which represents 9:00 AM)
  if (typeof timeStr === "number" && timeStr < 1) {
    const totalMinutes = Math.round(timeStr * 24 * 60);
    return totalMinutes;
  }
  const str = String(timeStr).trim();
  const parts = str.split(":");
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
};

// Helper: Format minutes back to HH:MM time string
export const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hStr = h.toString().padStart(2, "0");
  const mStr = m.toString().padStart(2, "0");
  return `${hStr}:${mStr}`;
};

// Helper: Map time to grid slot index (09:00 is slot 0, 10:00 is slot 1, etc.)
export const getSlotIndex = (startTimeStr) => {
  const mins = timeToMinutes(startTimeStr);
  const hour = Math.floor(mins / 60);
  // Grid covers 9 AM (index 0) to 5 PM (index 7)
  const slotIdx = hour - 9;
  return Math.min(Math.max(0, slotIdx), 7);
};

// Standard weekdays list
const VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Validates list of timetable entries, detecting errors, overlaps, and invalid values
 * @param {Array} entries
 * @returns {Array} List of validation error strings
 */
export const validateEntries = (entries) => {
  const errors = [];
  const dayGroups = {};

  entries.forEach((entry, index) => {
    const rowNum = index + 2; // Approximate row number in sheet
    
    // 1. Basic Fields Checks
    if (!entry.day) {
      errors.push(`Row ${rowNum}: Missing day.`);
    } else if (!VALID_DAYS.some(d => d.toLowerCase() === entry.day.trim().toLowerCase())) {
      errors.push(`Row ${rowNum}: Unknown day name "${entry.day}". Supported: Mon-Sat.`);
    }

    if (!entry.subjectName) {
      errors.push(`Row ${rowNum}: Missing subject name.`);
    }

    if (!entry.startTime) {
      errors.push(`Row ${rowNum}: Missing start time.`);
    }

    if (!entry.endTime) {
      errors.push(`Row ${rowNum}: Missing end time.`);
    }

    // 2. Validate Time Range
    if (entry.startTime && entry.endTime) {
      const startMins = timeToMinutes(entry.startTime);
      const endMins = timeToMinutes(entry.endTime);
      
      if (startMins === 0 && !String(entry.startTime).includes("00:00")) {
        errors.push(`Row ${rowNum}: Invalid start time format "${entry.startTime}". Expected HH:MM.`);
      }
      if (endMins === 0 && !String(entry.endTime).includes("00:00")) {
        errors.push(`Row ${rowNum}: Invalid end time format "${entry.endTime}". Expected HH:MM.`);
      }

      if (startMins >= endMins && startMins > 0 && endMins > 0) {
        errors.push(`Row ${rowNum}: Start time (${entry.startTime}) must be before end time (${entry.endTime}).`);
      }
    }

    // 3. Overlap Grouping
    if (entry.day && entry.startTime && entry.endTime) {
      const dayKey = entry.day.trim().toLowerCase();
      if (!dayGroups[dayKey]) {
        dayGroups[dayKey] = [];
      }
      dayGroups[dayKey].push({ ...entry, rowNum });
    }
  });

  // 4. Overlap & Conflict Check
  Object.keys(dayGroups).forEach((day) => {
    const dayEntries = dayGroups[day];
    for (let i = 0; i < dayEntries.length; i++) {
      const e1 = dayEntries[i];
      const start1 = timeToMinutes(e1.startTime);
      const end1 = timeToMinutes(e1.endTime);

      for (let j = i + 1; j < dayEntries.length; j++) {
        const e2 = dayEntries[j];
        const start2 = timeToMinutes(e2.startTime);
        const end2 = timeToMinutes(e2.endTime);

        // Overlaps if: start1 < end2 AND start2 < end1
        if (start1 < end2 && start2 < end1) {
          errors.push(
            `Conflict on ${e1.day}: "${e1.subjectName}" (Row ${e1.rowNum}) overlaps with "${e2.subjectName}" (Row ${e2.rowNum}) between ${e1.startTime}-${e1.endTime} and ${e2.startTime}-${e2.endTime}.`
          );
        }
      }
    }
  });

  return errors;
};

/**
 * Parses JSON file data following the expected nested weekdays structure
 * @param {string} text 
 * @returns {Object} { data, errors }
 */
export const parseJSONTimetable = (text) => {
  try {
    const parsed = JSON.parse(text);
    const entries = [];
    const errors = [];

    // Verify it is a valid object dictionary
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { data: [], errors: ["Invalid JSON format: Expected a dictionary of weekdays."] };
    }

    Object.keys(parsed).forEach((dayKey) => {
      // Find matching standard weekday name
      const matchedDay = VALID_DAYS.find((d) => d.toLowerCase() === dayKey.trim().toLowerCase());
      if (!matchedDay) {
        errors.push(`JSON contains unknown day key "${dayKey}".`);
        return;
      }

      const dayLectures = parsed[dayKey];
      if (!Array.isArray(dayLectures)) {
        errors.push(`JSON key "${dayKey}" must map to an array of lectures.`);
        return;
      }

      dayLectures.forEach((lec, idx) => {
        const itemNum = idx + 1;
        
        // Parse fields
        const subjectName = lec.subject || lec.subjectName || "";
        const code = lec.code || lec.subjectCode || "";
        const typeRaw = lec.type || lec.lectureType || "Theory";
        const startTime = lec.start || lec.startTime || "";
        const endTime = lec.end || lec.endTime || "";
        const facultyName = lec.faculty || lec.facultyName || "Unknown";
        
        // Normalize type
        const lectureType = String(typeRaw).toLowerCase().includes("lab") ? "Lab" : "Theory";

        entries.push({
          day: matchedDay,
          slotIndex: getSlotIndex(startTime),
          subjectName: String(subjectName).trim(),
          lectureType,
          facultyName: String(facultyName).trim(),
          room: lec.room ? String(lec.room).trim() : undefined,
          code: String(code).trim() || undefined,
          startTime: String(startTime).trim(),
          endTime: String(endTime).trim(),
        });
      });
    });

    const validationErrors = validateEntries(entries);
    return { data: entries, errors: [...errors, ...validationErrors] };
  } catch (err) {
    return { data: [], errors: [`Failed to parse JSON: ${err.message}`] };
  }
};

/**
 * Parses binary/buffer data from Excel sheet file (.xlsx, .xls, .csv)
 * @param {ArrayBuffer} arrayBuffer 
 * @returns {Promise<Object>} { data, errors }
 */
export const parseExcelTimetable = (arrayBuffer) => {
  return new Promise((resolve) => {
    try {
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Parse worksheet rows to raw json rows
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      const entries = [];
      const errors = [];

      if (rawRows.length === 0) {
        resolve({ data: [], errors: ["The spreadsheet file contains no rows."] });
        return;
      }

      // Check header columns mapping
      const firstRow = rawRows[0];
      const keys = Object.keys(firstRow);

      const findKey = (candidates) => {
        return keys.find((k) =>
          candidates.some((c) => k.trim().toLowerCase() === c.toLowerCase())
        );
      };

      const dayKey = findKey(["day", "weekday"]);
      const subjectKey = findKey(["subject", "subjectname", "subject name", "course"]);
      const codeKey = findKey(["code", "subject code", "subjectcode", "coursecode", "course code"]);
      const typeKey = findKey(["type", "lecturetype", "lecture type", "class type", "classtype"]);
      const startKey = findKey(["start time", "starttime", "start", "from"]);
      const endKey = findKey(["end time", "endtime", "end", "to"]);
      const facultyKey = findKey(["faculty", "facultyname", "faculty name", "instructor", "professor"]);
      const roomKey = findKey(["room", "classroom", "lab"]);

      // Verify essential headers
      if (!dayKey || !subjectKey || !startKey || !endKey) {
        const missing = [];
        if (!dayKey) missing.push("Day");
        if (!subjectKey) missing.push("Subject");
        if (!startKey) missing.push("Start Time");
        if (!endKey) missing.push("End Time");
        resolve({
          data: [],
          errors: [`Missing required columns: ${missing.join(", ")}. Please align your headers.`],
        });
        return;
      }

      rawRows.forEach((row, idx) => {
        // Parse day value
        const rawDay = row[dayKey] ? String(row[dayKey]).trim() : "";
        const matchedDay = VALID_DAYS.find((d) => d.toLowerCase() === rawDay.toLowerCase());

        // Format start/end times if SheetJS parsed them as numeric serials
        let startVal = row[startKey];
        if (typeof startVal === "number" && startVal < 1) {
          startVal = minutesToTime(timeToMinutes(startVal));
        } else {
          startVal = startVal ? String(startVal).trim() : "";
        }

        let endVal = row[endKey];
        if (typeof endVal === "number" && endVal < 1) {
          endVal = minutesToTime(timeToMinutes(endVal));
        } else {
          endVal = endVal ? String(endVal).trim() : "";
        }

        const typeRaw = typeKey ? String(row[typeKey]).toLowerCase() : "";
        const lectureType = typeRaw.includes("lab") ? "Lab" : "Theory";

        const subjectVal = row[subjectKey] ? String(row[subjectKey]).trim() : "";
        const codeVal = codeKey && row[codeKey] ? String(row[codeKey]).trim() : undefined;
        const facultyVal = facultyKey && row[facultyKey] ? String(row[facultyKey]).trim() : "Unknown";
        const roomVal = roomKey && row[roomKey] ? String(row[roomKey]).trim() : undefined;

        entries.push({
          day: matchedDay || rawDay, // Pass raw for validation error display
          slotIndex: getSlotIndex(startVal),
          subjectName: subjectVal,
          lectureType,
          facultyName: facultyVal,
          room: roomVal,
          code: codeVal,
          startTime: startVal,
          endTime: endVal,
        });
      });

      const validationErrors = validateEntries(entries);
      resolve({ data: entries, errors: validationErrors });
    } catch (err) {
      resolve({ data: [], errors: [`Excel Parsing failed: ${err.message}`] });
    }
  });
};

/**
 * Packs flat parsed entries array back into nested JSON weekdays schema
 * @param {Array} entries 
 * @returns {Object} Mapped timetable JSON schema
 */
export const exportToJSONTimetable = (entries) => {
  const result = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };

  entries.forEach((e) => {
    if (result[e.day]) {
      result[e.day].push({
        subject: e.subjectName,
        code: e.code || "",
        type: e.lectureType,
        start: e.startTime,
        end: e.endTime,
        faculty: e.facultyName || "",
        room: e.room || "",
      });
    }
  });

  return result;
};

// Helper to parse dates from Excel rows
export const parseDateValue = (val) => {
  if (!val) return "";
  if (typeof val === "number") {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split("T")[0];
  }
  
  const str = String(val).trim();
  const dm = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dm) {
    const day = dm[1].padStart(2, "0");
    const month = dm[2].padStart(2, "0");
    const year = dm[3];
    return `${year}-${month}-${day}`;
  }
  
  const ym = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ym) {
    const year = ym[1];
    const month = ym[2].padStart(2, "0");
    const day = ym[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  } catch (e) {}

  return str;
};

// Parse Excel sheet for historical attendance records
export const parseExcelAttendance = (arrayBuffer) => {
  return new Promise((resolve) => {
    try {
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      const logs = [];
      const errors = [];

      if (rawRows.length === 0) {
        resolve({ data: [], errors: ["The spreadsheet file contains no rows."] });
        return;
      }

      const firstRow = rawRows[0];
      const keys = Object.keys(firstRow);

      const findKey = (candidates) => {
        return keys.find((k) =>
          candidates.some((c) => k.trim().toLowerCase() === c.toLowerCase())
        );
      };

      const dateKey = findKey(["date", "lecturedate", "lecture date", "day"]);
      const subjectKey = findKey(["subject", "subjectname", "subject name", "course"]);
      const typeKey = findKey(["type", "lecturetype", "lecture type", "class type", "classtype"]);
      const startKey = findKey(["start time", "starttime", "start", "from"]);
      const endKey = findKey(["end time", "endtime", "end", "to"]);
      const statusKey = findKey(["status", "attendance", "mark", "state"]);

      if (!dateKey || !subjectKey || !statusKey) {
        const missing = [];
        if (!dateKey) missing.push("Date");
        if (!subjectKey) missing.push("Subject");
        if (!statusKey) missing.push("Status");
        resolve({
          data: [],
          errors: [`Missing required columns: ${missing.join(", ")}.`],
        });
        return;
      }

      rawRows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const rawDate = row[dateKey];
        const parsedDate = parseDateValue(rawDate);
        const subjectVal = row[subjectKey] ? String(row[subjectKey]).trim() : "";
        const rawStatus = row[statusKey] ? String(row[statusKey]).trim().toLowerCase() : "";

        if (!parsedDate) {
          errors.push(`Row ${rowNum}: Missing or invalid Date.`);
          return;
        }
        if (!subjectVal) {
          errors.push(`Row ${rowNum}: Missing Subject Name.`);
          return;
        }

        // Map status
        let status = "Present";
        if (rawStatus.startsWith("p")) {
          status = "Present";
        } else if (rawStatus.startsWith("a")) {
          status = "Absent";
        } else if (rawStatus.startsWith("c")) {
          status = "Cancelled";
        } else if (rawStatus.startsWith("h")) {
          status = "Holiday";
        } else {
          errors.push(`Row ${rowNum}: Unknown status "${row[statusKey]}". Expected Present, Absent, Cancelled, or Holiday.`);
          return;
        }

        // Optional/Default values
        let startVal = startKey ? row[startKey] : "09:00";
        if (typeof startVal === "number" && startVal < 1) {
          startVal = minutesToTime(timeToMinutes(startVal));
        } else {
          startVal = startVal ? String(startVal).trim() : "09:00";
        }

        let endVal = endKey ? row[endKey] : "10:00";
        if (typeof endVal === "number" && endVal < 1) {
          endVal = minutesToTime(timeToMinutes(endVal));
        } else {
          endVal = endVal ? String(endVal).trim() : "10:00";
        }

        const typeRaw = typeKey ? String(row[typeKey]).toLowerCase() : "";
        const lectureType = typeRaw.includes("lab") ? "Lab" : "Theory";

        logs.push({
          date: parsedDate,
          subjectName: subjectVal,
          lectureType,
          startTime: startVal,
          endTime: endVal,
          status,
        });
      });

      resolve({ data: logs, errors });
    } catch (err) {
      resolve({ data: [], errors: [`Excel Parsing failed: ${err.message}`] });
    }
  });
};
