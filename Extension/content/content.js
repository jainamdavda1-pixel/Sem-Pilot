/**
 * SemPilot Classroom Content Scraper Script
 */

// Listen for messages from popup controls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SCRAPE_COURSES") {
    (async () => {
      try {
        const courses = await scrapeCoursesList();
        sendResponse({ success: true, data: courses });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep channel open
  }

  if (request.action === "SCRAPE_ASSIGNMENTS") {
    (async () => {
      try {
        const assignments = await scrapeAssignmentsList();
        sendResponse({ success: true, data: assignments });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep channel open
  }
});

/**
 * Scrapes Courses cards from Google Classroom main dashboard page
 */
async function scrapeCoursesList() {
  // Wait up to 5 seconds for course items to render
  await waitForSelector("a[href*='/c/']", 5000);

  const courseLinks = document.querySelectorAll("a[href*='/c/']");
  const coursesMap = new Map();

  courseLinks.forEach(link => {
    const url = link.href;
    const urlParts = url.match(/\/c\/([^\/]+)/);
    if (!urlParts) return;

    const courseId = urlParts[1];
    
    // Find text inside the link container or sibling headings
    let name = link.innerText.trim();
    if (!name) {
      const heading = link.querySelector("h2, h3, div");
      name = heading ? heading.innerText.trim() : "Unnamed Course";
    }

    // Split name cleanups (often has section info on next lines)
    name = name.split("\n")[0].trim();

    if (courseId && name && !coursesMap.has(courseId)) {
      coursesMap.set(courseId, {
        googleCourseId: courseId,
        courseName: name
      });
    }
  });

  return Array.from(coursesMap.values());
}

/**
 * Scrapes Assignments/Classwork elements from active course view
 */
async function scrapeAssignmentsList() {
  // Wait up to 6 seconds for assignment elements list
  await waitForSelector("div[role='listitem'], div[role='heading'], a[href*='/a/']", 6000);

  const assignments = [];
  const activeCourseId = getActiveCourseIdFromUrl();

  // Find all cards or anchors referencing coursework paths (/c/.../a/...)
  const courseworkLinks = document.querySelectorAll("a[href*='/a/']");
  const seenIds = new Set();

  const BATCH_SIZE = 10;
  const elementsArray = Array.from(courseworkLinks);

  for (let i = 0; i < elementsArray.length; i += BATCH_SIZE) {
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        const batch = elementsArray.slice(i, i + BATCH_SIZE);
        
        batch.forEach((link) => {
          const href = link.href;
          const match = href.match(/\/c\/([^\/]+)\/a\/([^\/]+)/);
          if (!match) return;

          const courseId = match[1] || activeCourseId;
          const assignmentId = match[2];

          if (seenIds.has(assignmentId)) return;
          seenIds.add(assignmentId);

          // Resolve assignment detail elements relative to this link card
          let title = "Classroom Assignment";
          let parentCard = link.closest("div[role='listitem']") || link.parentElement;
          
          const textSearch = parentCard ? parentCard.innerText : "";
          
          // Get Title
          const titleEl = link.querySelector("div, span, h3") || link;
          title = titleEl.innerText.split("\n")[0].trim() || link.innerText.trim() || "Untitled Assignment";

          // Get due date / deadline text
          let dueString = "";
          const dueRegex = /(due|turned in|returned|graded|assigned|submitted)\s+([^(\n,]+)/i;
          const dueMatch = textSearch.match(dueRegex);
          if (dueMatch) {
            dueString = dueMatch[0].trim();
          } else {
            const lines = textSearch.split("\n");
            const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            for (const line of lines) {
              const lowerLine = line.toLowerCase();
              if (months.some(m => lowerLine.includes(m)) || lowerLine.includes("tomorrow") || lowerLine.includes("today")) {
                dueString = line.trim();
                break;
              }
            }
          }

          // Extract description / notes
          let description = "";
          const descEl = parentCard ? parentCard.querySelector("div[role='button'] + div") : null;
          if (descEl) {
            description = descEl.innerText.trim();
          }

          // Detect submissions states
          let submissionStatus = "PENDING";
          const lowerText = textSearch.toLowerCase();
          if (lowerText.includes("turned in") || lowerText.includes("submitted") || lowerText.includes("graded") || lowerText.includes("returned")) {
            submissionStatus = "COMPLETED";
          } else if (lowerText.includes("missing") || lowerText.includes("late")) {
            submissionStatus = "OVERDUE";
          }

          // Gather attachment anchors
          const attachments = [];
          if (parentCard) {
            parentCard.querySelectorAll("a").forEach(anchor => {
              if (anchor.href && !anchor.href.includes("/a/") && !attachments.includes(anchor.href)) {
                attachments.push(anchor.href);
              }
            });
          }

          assignments.push({
            googleAssignmentId: assignmentId,
            googleCourseId: courseId,
            title,
            description,
            dueString,
            submissionStatus,
            attachments: JSON.stringify(attachments)
          });
        });
        resolve();
      });
    });

    if (globalThis.scheduler?.yield) {
      await scheduler.yield();
    }
  }

  return assignments;
}

/**
 * Parse course ID from URL hash paths
 */
function getActiveCourseIdFromUrl() {
  const match = window.location.href.match(/\/c\/([^\/]+)/);
  return match ? match[1] : "default-classroom-course";
}

/**
 * Safe mutation await helper
 */
function waitForSelector(selector, timeout = 5000) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(true);
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(false);
    }, timeout);
  });
}
