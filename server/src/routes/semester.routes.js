import { Router } from 'express';
import {
  getSemester,
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  syncFullData,
  importFullData,
  getActiveSemester
} from '../controllers/semester.controller.js';

const router = Router();

router.route('/sync-full-data')
  .post(syncFullData);

router.route('/active')
  .get(getActiveSemester);

router.route('/import')
  .post(importFullData);

router.route('/')
  .get(getSemesters)
  .post(createSemester);

router.route('/:id')
  .get(getSemester)
  .put(updateSemester)
  .delete(deleteSemester);

export default router;
