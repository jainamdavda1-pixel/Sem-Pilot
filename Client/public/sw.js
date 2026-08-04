/**
 * SemPilot Service Worker for Push Notifications
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "SemPilot Alert";
    const options = {
      body: payload.body || "",
      icon: "/android-chrome-192x192.png", // fallback icons
      badge: "/favicon-32x32.png",
      data: payload.data || { url: "/" },
      vibrate: [100, 50, 100],
      actions: [
        { action: "open", title: "Open SemPilot" }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error("Error parsing push notification data payload:", err);
    // Simple text fallback
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("SemPilot Alert", {
        body: text,
        data: { url: "/" }
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and redirect
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && "focus" in client) {
          client.postMessage({ type: "NAVIGATE", url: urlToOpen });
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
