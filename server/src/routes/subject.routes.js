import { Router } from 'express';
import {
  getSubject,
  getSemesterSubjects,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/subject.controller.js';

const router = Router();

router.route('/')
  .get(getSemesterSubjects)
  .post(createSubject);

router.route('/:id')
  .get(getSubject)
  .put(updateSubject)
  .delete(deleteSubject);

export default router;
