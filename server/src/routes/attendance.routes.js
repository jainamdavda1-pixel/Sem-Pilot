import { Router } from 'express';
import {
  getAttendance,
  getSubjectAttendance,
  recordAttendance,
  updateAttendance,
  deleteAttendance,
  syncAttendance
} from '../controllers/attendance.controller.js';

const router = Router();

router.route('/sync')
  .post(syncAttendance);

router.route('/')
  .get(getSubjectAttendance)
  .post(recordAttendance);

router.route('/:id')
  .get(getAttendance)
  .put(updateAttendance)
  .delete(deleteAttendance);

export default router;
