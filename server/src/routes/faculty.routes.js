import { Router } from 'express';
import { createFaculty, getFaculties } from '../controllers/faculty.controller.js';

const router = Router();

router.route('/')
  .post(createFaculty)
  .get(getFaculties);

export default router;
