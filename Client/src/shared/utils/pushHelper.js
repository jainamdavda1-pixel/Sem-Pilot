const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

/**
 * Convert base64 VAPID public key to standard Uint8Array format
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register SW, request notification permission, and subscribe to push service
 */
export async function registerPushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("⚠️ Browser does not support Service Workers or Push Notifications.");
    return null;
  }

  try {
    // 1. Register Service Worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/"
    });
    console.log("🚀 Service Worker registered successfully scope:", registration.scope);

    // 2. Request Notification Permission
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.warn("🔔 Notification permission denied.");
      return null;
    }

    // 3. Fetch VAPID Public Key from server
    const keyRes = await fetch(`${API_BASE}/api/v1/notifications/push/key`);
    const keyData = await keyRes.json();

    if (!keyData.success || !keyData.data.publicKey) {
      throw new Error("Failed to retrieve VAPID public key from backend server");
    }

    const applicationServerKey = urlBase64ToUint8Array(keyData.data.publicKey);

    // 4. Subscribe user using push manager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // 5. Send subscription parameters to backend DB
    const userObj = JSON.parse(localStorage.getItem("sempilot_user") || "null");
    const userId = userObj?.id || "default-user";

    const subRes = await fetch(`${API_BASE}/api/v1/notifications/push/subscribe?userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription })
    });

    const subResult = await subRes.json();
    if (subResult.success) {
      console.log("✅ Registered Browser Push subscription successfully in Neon Postgres.");
      return subscription;
    } else {
      throw new Error(subResult.message || "Failed to persist subscription details in backend DB");
    }
  } catch (err) {
    console.error("❌ Error registering push notifications:", err);
    return null;
  }
}
