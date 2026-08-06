/**
 * SemPilot Background Service Worker
 */

const DEV_API = "http://localhost:5001";
const PROD_API = "https://semesterpilot-backend.onrender.com";

// Handle startup and alarm registrations
chrome.runtime.onInstalled.addListener(async () => {
  console.log("SemPilot Extension background helper active.");
  const { autoSyncEnabled = false } = await chrome.storage.local.get("autoSyncEnabled");
  if (autoSyncEnabled) {
    registerAutoSyncAlarm();
  }
});

// Listen to alarms triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "classroom-auto-sync") {
    console.log("⏰ Auto sync alarm triggered in background...");
    try {
      await runBackgroundSync();
    } catch (err) {
      console.error("Background sync error:", err);
    }
  }
});

// Listener for settings toggles messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TOGGLE_AUTOSYNC") {
    (async () => {
      const enabled = request.enabled;
      await chrome.storage.local.set({ autoSyncEnabled: enabled });
      
      if (enabled) {
        registerAutoSyncAlarm();
        console.log("Background Auto-Sync Alarm active.");
      } else {
        await chrome.alarms.clear("classroom-auto-sync");
        console.log("Background Auto-Sync Alarm deactivated.");
      }
      sendResponse({ success: true });
    })();
    return true; // Keep channel open
  }
});

function registerAutoSyncAlarm() {
  chrome.alarms.create("classroom-auto-sync", {
    delayInMinutes: 1,
    periodInMinutes: 60 // Run hourly
  });
}

/**
 * Find open classroom tabs and execute sync in background
 */
async function runBackgroundSync() {
  const tabs = await chrome.tabs.query({ url: "https://classroom.google.com/*" });
  if (tabs.length === 0) {
    console.log("No active classroom tabs found. Skipping auto-sync.");
    return;
  }

  // Get active user details from open SemPilot tabs
  const sempilotTabs = await chrome.tabs.query({ url: ["http://localhost:5173/*", "https://semesterpilot.vercel.app/*"] });
  let activeUserId = null;
  let activeApiBase = DEV_API;

  for (const tab of sempilotTabs) {
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { action: "GET_USER" });
      if (res && res.success && res.user) {
        activeUserId = res.user.id;
        activeApiBase = tab.url.includes("localhost") ? DEV_API : PROD_API;
        break;
      }
    } catch (err) {}
  }

  if (!activeUserId) {
    console.warn("User not logged in to SemPilot. Skipping auto-sync.");
    return;
  }

  // Trigger sync on the first classroom tab
  const targetTab = tabs[0];
  try {
    const response = await chrome.tabs.sendMessage(targetTab.id, { action: "SCRAPE_ASSIGNMENTS" });
    if (response && response.success && response.data.length > 0) {
      console.log(`Auto-scraped ${response.data.length} items. Syncing...`);
      
      const syncRes = await fetch(`${activeApiBase}/api/v1/import/classroom/assignments?userId=${activeUserId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ assignments: response.data })
      });

      const body = await syncRes.json();
      if (syncRes.ok && body.success) {
        console.log(`Auto-sync success. New: ${body.data.newCount}, Updated: ${body.data.updatedCount}`);
        await chrome.storage.local.set({ 
          lastSync: Date.now(), 
          count: body.data.total 
        });
      }
    }
  } catch (err) {
    console.error("Auto sync job failed:", err);
  }
}
