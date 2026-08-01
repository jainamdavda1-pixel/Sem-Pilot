/**
 * Utility functions for calculating SemPilot attendance statistics
 */

// Helper to convert target percentage string/number to decimal
export const parseTargetPercent = (target) => {
  if (typeof target === "string") {
    return parseFloat(target.replace("%", "")) / 100;
  }
  if (typeof target === "number") {
    return target > 1 ? target / 100 : target;
  }
  return 0.75; // Default 75%
};

/**
 * Calculates all attendance indicators based on logs and subjects
 * @param {Array} logs - Current logged attendance rows [{ subjectName, lectureType, status, date, startTime }]
 * @param {Array} subjects - Subject master configuration [{ name, priority, facultyStrictness, facultyRating }]
 * @param {number|string} targetRaw - Preferred attendance target (e.g. 75 or "75%")
 * @returns {Object} Calculated metrics
 */
export const calculateAttendanceStats = (logs = [], subjects = [], targetRaw = 75) => {
  const target = parseTargetPercent(targetRaw);
  
  // Overall logs totals
  const overallAttended = logs.filter((l) => l.status === "Present").length;
  const overallTotal = logs.length;
  const overallPercentage = overallTotal > 0 ? Math.round((overallAttended / overallTotal) * 100) : 0;

  // Theory logs totals
  const theoryLogs = logs.filter((l) => l.lectureType === "Theory");
  const theoryAttended = theoryLogs.filter((l) => l.status === "Present").length;
  const theoryTotal = theoryLogs.length;
  const theoryPercentage = theoryTotal > 0 ? Math.round((theoryAttended / theoryTotal) * 100) : 0;

  // Lab logs totals
  const labLogs = logs.filter((l) => l.lectureType === "Lab");
  const labAttended = labLogs.filter((l) => l.status === "Present").length;
  const labTotal = labLogs.length;
  const labPercentage = labTotal > 0 ? Math.round((labAttended / labTotal) * 100) : 0;

  // Calculate overall attendance margin bank
  let marginText = "";
  let marginType = "neutral";
  let marginValue = 0;

  if (overallTotal === 0) {
    marginText = "No attendance logged yet";
    marginType = "neutral";
  } else if (overallPercentage >= target * 100) {
    // Safe to bunk consecutive classes
    // Formula: b = Math.floor((attended - target * total) / target)
    const b = Math.floor((overallAttended - target * overallTotal) / target);
    marginValue = Math.max(0, b);
    marginType = "success";
    marginText = marginValue === 1 ? "Safe to bunk 1 class" : `Safe to bunk ${marginValue} classes`;
    if (marginValue === 0) {
      marginText = "At threshold. Do not bunk next class.";
      marginType = "warning";
    }
  } else {
    // Must attend consecutive classes
    // Formula: a = Math.ceil((target * total - attended) / (1 - target))
    const a = Math.ceil((target * overallTotal - overallAttended) / (1 - target));
    marginValue = Math.max(0, a);
    marginType = "danger";
    marginText = `Must attend next ${marginValue} classes`;
  }

  // Calculate stats for every single subject
  const subjectStats = subjects.map((sub) => {
    const subLogs = logs.filter((l) => l.subjectName?.toLowerCase() === sub.name?.toLowerCase());
    const attended = subLogs.filter((l) => l.status === "Present").length;
    const total = subLogs.length;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    const absent = total - attended;

    // Splits for theory/lab sub-modules
    const thLogs = subLogs.filter((l) => l.lectureType === "Theory");
    const thAttended = thLogs.filter((l) => l.status === "Present").length;
    const thTotal = thLogs.length;
    const thPercent = thTotal > 0 ? Math.round((thAttended / thTotal) * 100) : null;

    const lbLogs = subLogs.filter((l) => l.lectureType === "Lab");
    const lbAttended = lbLogs.filter((l) => l.status === "Present").length;
    const lbTotal = lbLogs.length;
    const lbPercent = lbTotal > 0 ? Math.round((lbAttended / lbTotal) * 100) : null;

    // Calculate subject-specific bunk/attend margin
    let subMarginText = "";
    let subMarginType = "neutral";
    if (total > 0) {
      if (percentage >= target * 100) {
        const b = Math.floor((attended - target * total) / target);
        const limit = Math.max(0, b);
        subMarginType = "success";
        subMarginText = limit === 0 ? "At threshold" : `Can bunk ${limit}`;
      } else {
        const a = Math.ceil((target * total - attended) / (1 - target));
        subMarginType = "danger";
        subMarginText = `Attend next ${a}`;
      }
    } else {
      subMarginText = "No classes";
    }

    return {
      ...sub,
      attended,
      total,
      absent,
      percentage,
      theoryPercent: thPercent,
      theoryAttended: thAttended,
      theoryTotal: thTotal,
      labPercent: lbPercent,
      labAttended: lbAttended,
      labTotal: lbTotal,
      marginText: subMarginText,
      marginType: subMarginType,
    };
  });

  // Identify subjects below target
  const subjectsBelowTarget = subjectStats.filter((s) => s.total > 0 && s.percentage < target * 100);

  // Time-of-day greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return {
    overallPercentage,
    overallAttended,
    overallTotal,
    theoryPercentage,
    theoryTotal,
    labPercentage,
    labTotal,
    marginText,
    marginType,
    marginValue,
    subjectStats,
    subjectsBelowTarget,
    greeting: getGreeting(),
  };
};
