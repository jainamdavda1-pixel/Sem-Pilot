import { Router } from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  savePushSubscription,
  getPublicKey,
  getPreferences,
  updatePreferences
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", getNotifications);
router.post("/read", markAllNotificationsAsRead);
router.put("/:id/read", markNotificationAsRead);
router.post("/push/subscribe", savePushSubscription);
router.get("/push/key", getPublicKey);
router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

export default router;
