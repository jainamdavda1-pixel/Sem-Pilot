// Reusable attendance helpers (math margins, target rates)
export const calculatePercentage = (attended, total) => {
  if (!total || total === 0) return 0;
  return Math.round((attended / total) * 100);
};

export const getBunkMargin = (attended, total, requirement = 75) => {
  const reqFraction = requirement / 100;
  // If user is already below target or has no lectures
  if (total === 0) return 0;
  
  // Maximum number of lectures a user can bunk
  const maxBunkable = Math.floor((attended - reqFraction * total) / reqFraction);
  return maxBunkable >= 0 ? maxBunkable : 0;
};

export const getRequiredToCatchUp = (attended, total, requirement = 75) => {
  const reqFraction = requirement / 100;
  const currentPercent = calculatePercentage(attended, total);
  if (currentPercent >= requirement) return 0;

  // Number of consecutive lectures user must attend to reach target
  return Math.ceil((reqFraction * total - attended) / (1 - reqFraction));
};
