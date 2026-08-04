import webpush from "web-push";
import { prisma } from "../lib/prisma.js";

let isVapidInitialized = false;

// Dynamic VAPID Keys Fallback in case they aren't set in .env
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:developer@sempilot.app";

export function initializeVapid() {
  if (isVapidInitialized) return;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("⚠️ VAPID keys not configured in environment. Generating dynamic fallback credentials for testing...");
    const keys = webpush.generateVAPIDKeys();
    vapidPublicKey = keys.publicKey;
    vapidPrivateKey = keys.privateKey;
    console.log(`💡 [VAPID CONFIG] Set these in your server/.env:
VAPID_PUBLIC_KEY="${vapidPublicKey}"
VAPID_PRIVATE_KEY="${vapidPrivateKey}"`);
  }

  try {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    isVapidInitialized = true;
    console.log("🚀 Web Push VAPID credentials configured successfully.");
  } catch (err) {
    console.error("❌ Failed to configure Web Push VAPID Details:", err);
  }
}

export function getVapidPublicKey() {
  initializeVapid();
  return vapidPublicKey;
}

/**
 * Send browser push notification to all subscriptions of a specific user
 */
export async function sendPushNotification(userId, payload) {
  initializeVapid();

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  });

  if (subscriptions.length === 0) {
    return { success: false, sentCount: 0, reason: "No active push subscriptions found for user" };
  }

  const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);
  const sendPromises = subscriptions.map(async (sub) => {
    try {
      // Re-map db keys field to standard subscription format
      const pushSubscription = {
        endpoint: sub.endpoint,
        expirationTime: sub.expirationTime,
        keys: typeof sub.keys === "string" ? JSON.parse(sub.keys) : sub.keys
      };

      await webpush.sendNotification(pushSubscription, payloadString);
      return { id: sub.id, success: true };
    } catch (err) {
      console.error(`❌ Push notification failed for subscription endpoint: ${sub.endpoint}. Error:`, err);
      // Clean up subscription from DB if it is expired or invalid (410 Gone / 404 Not Found)
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.warn(`🧹 Pruning expired push subscription ID: ${sub.id}`);
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      return { id: sub.id, success: false, error: err.message };
    }
  });

  const results = await Promise.all(sendPromises);
  const successful = results.filter(r => r.success).length;

  return {
    success: successful > 0,
    sentCount: successful,
    totalCount: subscriptions.length,
    results
  };
}
