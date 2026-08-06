/**
 * SemPilot frontend bridge content script
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_USER") {
    try {
      const userStr = localStorage.getItem("sempilot_user") || "null";
      const user = JSON.parse(userStr);
      sendResponse({ success: true, user });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true; // Keep channel open
  }
});
