/**
 * SemPilot Sync extension popup controller logic
 */

const DEV_API = "http://localhost:5001";
const PROD_API = "https://semesterpilot-backend.onrender.com"; // backend address

document.addEventListener("DOMContentLoaded", async () => {
  const btnSyncCourses = document.getElementById("btn-sync-courses");
  const btnSyncAssignments = document.getElementById("btn-sync-assignments");
  const consolePanel = document.getElementById("sync-console");
  const consoleMsg = document.getElementById("console-msg");
  const toggleAuto = document.getElementById("toggle-auto-sync");

  let activeApiBase = DEV_API;
  let activeUserId = "default-user";

  // Verify and fetch active session details
  await resolveSession();
  await loadSavedMeta();

  // Bind Actions
  btnSyncCourses.addEventListener("click", async () => {
    showConsole("Querying active Classroom tab...");
    try {
      const tab = await getActiveClassroomTab();
      if (!tab) {
        showError("Open classroom.google.com first!");
        return;
      }

      showConsole("Extracting course cards from Classroom DOM...");
      const response = await chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_COURSES" });
      
      if (response && response.success) {
        showConsole(`Fetched ${response.data.length} course titles. Sending to SemPilot...`);
        const syncResult = await uploadPayload("/api/v1/import/classroom/courses", { courses: response.data });
        if (syncResult.success) {
          showSuccess(`Synced ${response.data.length} course mappings successfully!`);
        } else {
          showError(`Courses sync failed: ${syncResult.message}`);
        }
      } else {
        showError("Failed to parse DOM. Make sure you are on the home classroom page.");
      }
    } catch (err) {
      showError(err.message);
    }
  });

  btnSyncAssignments.addEventListener("click", async () => {
    showConsole("Querying active Classroom tab...");
    try {
      const tab = await getActiveClassroomTab();
      if (!tab) {
        showError("Open classroom.google.com first!");
        return;
      }

      showConsole("Extracting coursework items from Classroom DOM...");
      const response = await chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_ASSIGNMENTS" });

      if (response && response.success) {
        showConsole(`Fetched ${response.data.length} tasks. Syncing with SemPilot database...`);
        const syncResult = await uploadPayload("/api/v1/import/classroom/assignments", { assignments: response.data });
        if (syncResult.success) {
          showSuccess(`Imported ${syncResult.data.newCount} new and updated ${syncResult.data.updatedCount} assignments!`);
          updateLastSyncMeta(syncResult.data.total);
        } else {
          showError(`Sync failed: ${syncResult.message}`);
        }
      } else {
        showError("Failed to parse DOM. Go to Classwork page and try again.");
      }
    } catch (err) {
      showError(err.message);
    }
  });

  toggleAuto.addEventListener("change", async (e) => {
    const enabled = e.target.checked;
    await chrome.runtime.sendMessage({ action: "TOGGLE_AUTOSYNC", enabled });
  });

  // Helper querying active tab
  async function getActiveClassroomTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes("classroom.google.com")) {
      return tab;
    }
    return null;
  }

  // Resolve session dynamically from open SemPilot tabs (localhost / production Vercel)
  async function resolveSession() {
    const userDisplay = document.getElementById("user-display");
    try {
      const tabs = await chrome.tabs.query({ url: ["http://localhost:5173/*", "https://semesterpilot.vercel.app/*"] });
      let userResolved = null;

      for (const tab of tabs) {
        try {
          const res = await chrome.tabs.sendMessage(tab.id, { action: "GET_USER" });
          if (res && res.success && res.user) {
            userResolved = res.user;
            activeApiBase = tab.url.includes("localhost") ? DEV_API : PROD_API;
            break;
          }
        } catch (err) {
          // Tab may not be loaded or script not ready
        }
      }

      if (!userResolved) {
        userDisplay.innerHTML = "🔴 <a href='http://localhost:5173/' target='_blank' style='color:#EF4444;text-decoration:none;'>Login to SemPilot</a>";
        btnSyncAssignments.disabled = true;
        btnSyncCourses.disabled = true;
      } else {
        activeUserId = userResolved.id;
        userDisplay.innerText = `👤 ${userResolved.name || "Student"}`;
        userDisplay.classList.add("logged-in");
        btnSyncAssignments.disabled = false;
        btnSyncCourses.disabled = false;
      }
    } catch (err) {
      userDisplay.innerText = "Offline Mode";
    }
  }

  async function uploadPayload(endpoint, body) {
    const res = await fetch(`${activeApiBase}${endpoint}?userId=${activeUserId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    return await res.json();
  }

  function showConsole(msg) {
    consolePanel.classList.remove("hidden", "error", "success");
    consoleMsg.innerText = msg;
  }

  function showError(msg) {
    consolePanel.classList.add("error");
    consoleMsg.innerText = `❌ Error: ${msg}`;
  }

  function showSuccess(msg) {
    consolePanel.classList.add("success");
    consoleMsg.innerText = msg;
  }

  async function loadSavedMeta() {
    const cache = await chrome.storage.local.get(["lastSync", "count", "autoSyncEnabled"]);
    if (cache.lastSync) {
      document.getElementById("last-sync-time").innerText = new Date(cache.lastSync).toLocaleTimeString();
    }
    if (cache.count) {
      document.getElementById("courses-count").innerText = `${cache.count} items`;
    }
    if (cache.autoSyncEnabled) {
      toggleAuto.checked = true;
    }
  }

  async function updateLastSyncMeta(count) {
    const now = Date.now();
    await chrome.storage.local.set({ lastSync: now, count });
    document.getElementById("last-sync-time").innerText = new Date(now).toLocaleTimeString();
    document.getElementById("courses-count").innerText = `${count} items`;
  }
});
