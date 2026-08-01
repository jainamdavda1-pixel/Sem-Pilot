import { Router } from "express";
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  syncGoogleClassroom
} from "../controllers/assignment.controller.js";

const router = Router();

router.route("/")
  .get(getAssignments)
  .post(createAssignment);

router.post("/sync", syncGoogleClassroom);

router.route("/:id")
  .put(updateAssignment)
  .delete(deleteAssignment);

export default router;
