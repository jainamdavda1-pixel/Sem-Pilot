/**
 * Risk Engine for SemPilot
 * Computes a risk score (0-100) and category (Safe, Moderate, High, Critical) per subject.
 */

export const calculateSubjectRisk = (
  attendancePct,
  remainingLectures,
  credits = 3,
  absentCount = 0,
  trend = "stable"
) => {
  // If no classes have been logged yet
  if (attendancePct === 0 && absentCount === 0) {
    return { score: 10, category: "Safe" };
  }

  // 1. Base score derived from how far the current percentage is from 100%
  let baseScore = Math.max(0, 100 - attendancePct);

  // 2. Adjust for Credits
  // Higher credits increase the severity/impact of missing classes
  const creditsMultiplier = credits >= 4 ? 1.25 : credits <= 2 ? 0.8 : 1.0;
  let score = baseScore * creditsMultiplier;

  // 3. Adjust for Trend
  // If attendance is falling, increase risk. If improving, reduce risk.
  if (trend === "down") {
    score += 15;
  } else if (trend === "up") {
    score -= 15;
  }

  // 4. Adjust for High Absences
  if (absentCount > 5) {
    score += 10;
  }

  // 5. Adjust for Remaining buffer
  // If remaining classes are very low and the user is below target (e.g. 75%), risk increases critically
  if (remainingLectures <= 5 && attendancePct < 75) {
    score += 20;
  }

  // Clamp the score between 0 and 100
  score = Math.min(100, Math.max(0, Math.round(score)));

  // Categorize
  let category = "Safe";
  if (score >= 75) {
    category = "Critical";
  } else if (score >= 50) {
    category = "High";
  } else if (score >= 30) {
    category = "Moderate";
  }

  return { score, category };
};
