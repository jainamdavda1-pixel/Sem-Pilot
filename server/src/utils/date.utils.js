// Placeholder date helpers for the student planning calendar calculations
export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

export const getDaysBetween = (startDate, endDate) => {
  const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isHoliday = (date, holidays = []) => {
  const dateStr = formatDate(date);
  return holidays.some(h => formatDate(h.date) === dateStr);
};
