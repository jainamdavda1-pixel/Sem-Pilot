/**
 * Prediction Engine for SemPilot
 * Computes scenario projections (what-if scenarios) based on remaining lectures.
 */

export const projectScenarios = (present, totalActive, remainingLectures) => {
  // If there are no classes scheduled and none logged
  if (totalActive === 0 && remainingLectures === 0) {
    return {
      finalIfAllAttended: 100,
      finalIfNext5Missed: 100,
      finalIfAlternateAttended: 100,
      finalIfCurrentContinues: 100
    };
  }

  // 1. Scenario: Attending all remaining lectures
  const totalIfAllAttended = totalActive + remainingLectures;
  const presentIfAllAttended = present + remainingLectures;
  const finalIfAllAttended = totalIfAllAttended > 0 ? (presentIfAllAttended / totalIfAllAttended) * 100 : 0;

  // 2. Scenario: Missing the next 5 lectures
  const missedCount = Math.min(5, remainingLectures);
  const totalIfNext5Missed = totalActive + missedCount;
  const finalIfNext5Missed = totalIfNext5Missed > 0 ? (present / totalIfNext5Missed) * 100 : 0;

  // 3. Scenario: Attending alternate classes (1 present, 1 absent)
  const alternateAttended = Math.ceil(remainingLectures / 2);
  const totalIfAlternate = totalActive + remainingLectures;
  const presentIfAlternate = present + alternateAttended;
  const finalIfAlternateAttended = totalIfAlternate > 0 ? (presentIfAlternate / totalIfAlternate) * 100 : 0;

  // 4. Scenario: Current pattern continues
  const currentRate = totalActive > 0 ? present / totalActive : 1.0;
  const expectedAdditional = Math.round(remainingLectures * currentRate);
  const totalIfCurrent = totalActive + remainingLectures;
  const presentIfCurrent = present + expectedAdditional;
  const finalIfCurrentContinues = totalIfCurrent > 0 ? (presentIfCurrent / totalIfCurrent) * 100 : 0;

  return {
    finalIfAllAttended: Math.round(finalIfAllAttended * 10) / 10,
    finalIfNext5Missed: Math.round(finalIfNext5Missed * 10) / 10,
    finalIfAlternateAttended: Math.round(finalIfAlternateAttended * 10) / 10,
    finalIfCurrentContinues: Math.round(finalIfCurrentContinues * 10) / 10
  };
};
