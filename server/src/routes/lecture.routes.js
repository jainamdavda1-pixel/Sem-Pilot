import { Router } from 'express';
import {
  getLecture,
  getSubjectLectures,
  createLecture,
  updateLecture,
  deleteLecture
} from '../controllers/lecture.controller.js';

const router = Router();

router.route('/')
  .get(getSubjectLectures)
  .post(createLecture);

router.route('/:id')
  .get(getLecture)
  .put(updateLecture)
  .delete(deleteLecture);

export default router;
