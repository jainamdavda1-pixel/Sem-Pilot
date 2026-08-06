/**
 * Shared utility functions for SemPilot extension DOM scraping
 */

/**
 * Extracts class and coursework IDs from Google Classroom URL hash paths
 */
export function extractClassroomIds(url) {
  if (!url) return null;
  // Match format like: /c/MTU4Njkz/a/ODk1MzQ
  const match = url.match(/\/c\/([^\/]+)\/a\/([^\/]+)/);
  if (match) {
    return {
      courseId: match[1],
      assignmentId: match[2]
    };
  }
  
  // Alternative match format for stream/classwork list page: /c/MTU4Njkz
  const courseMatch = url.match(/\/c\/([^\/]+)/);
  if (courseMatch) {
    return {
      courseId: courseMatch[1],
      assignmentId: null
    };
  }
  return null;
}

/**
 * Simple hash generator to build stable IDs for non-classroom assignment records
 */
export function generateHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
