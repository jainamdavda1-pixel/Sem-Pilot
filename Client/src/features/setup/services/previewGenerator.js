export function generatePreviewDataset(rawDataset) {
  const subjects = [...(rawDataset.subjects || [])].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  
  const dayWeight = { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7 };
  const lectures = [...(rawDataset.lectures || [])].sort((a, b) => {
    const w1 = dayWeight[a.weekday?.toUpperCase()] || 99;
    const w2 = dayWeight[b.weekday?.toUpperCase()] || 99;
    if (w1 !== w2) return w1 - w2;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  const holidays = [...(rawDataset.holidays || [])].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return {
    semester: rawDataset.semester,
    faculties: rawDataset.faculties || [],
    subjects,
    lectures,
    holidays
  };
}
