import { Router } from "express";
import {
  getAuthUrl,
  handleCallback,
  getConnectionStatus,
  disconnectClassroom,
  getCourses,
  saveMappings,
  getMappings
} from "../controllers/classroom.controller.js";

const router = Router();

router.get("/auth-url", getAuthUrl);
router.post("/callback", handleCallback);
router.get("/status", getConnectionStatus);
router.post("/disconnect", disconnectClassroom);
router.get("/courses", getCourses);
router.post("/mappings", saveMappings);
router.get("/mappings", getMappings);

export default router;
