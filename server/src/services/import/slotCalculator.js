// Computes lecture duration and the set of timetable grid slots a lecture occupies.
// The timetable grid runs hourly from GRID_START_HOUR to GRID_END_HOUR (matches the
// 09:00-17:00 / 8-slot grid used by the client timetable UI). A lecture's duration is
// derived purely from its actual StartTime/EndTime - never hardcoded per lecture type.

export const GRID_START_HOUR = 9;
export const GRID_END_HOUR = 17;
export const SLOT_MINUTES = 60;

/**
 * @param {number|null} startMinutes minutes-since-midnight
 * @param {number|null} endMinutes minutes-since-midnight
 * @returns {{ duration: number, slotIndexes: number[] }}
 *   duration is in hours (e.g. 2 for a 2-hour lab, 1.5 for a 90-minute session).
 *   slotIndexes are 0-based grid slot indexes, e.g. [0,1] for a 09:00-11:00 lecture.
 */
export function computeSlots(startMinutes, endMinutes) {
  if (
    startMinutes === null ||
    startMinutes === undefined ||
    endMinutes === null ||
    endMinutes === undefined ||
    endMinutes <= startMinutes
  ) {
    return { duration: 0, slotIndexes: [] };
  }

  const durationMinutes = endMinutes - startMinutes;
  const duration = Math.round((durationMinutes / SLOT_MINUTES) * 100) / 100;

  const gridStartMinutes = GRID_START_HOUR * 60;
  const maxSlotIndex = GRID_END_HOUR - GRID_START_HOUR - 1;

  const startSlot = Math.floor((startMinutes - gridStartMinutes) / SLOT_MINUTES);
  const slotCount = Math.max(1, Math.ceil(durationMinutes / SLOT_MINUTES));

  const slotIndexes = [];
  for (let i = 0; i < slotCount; i++) {
    const idx = startSlot + i;
    if (idx >= 0 && idx <= maxSlotIndex) slotIndexes.push(idx);
  }

  return { duration, slotIndexes };
}
