import { Router } from 'express';
import {
  getHoliday,
  getSemesterHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday
} from '../controllers/holiday.controller.js';

const router = Router();

router.route('/')
  .get(getSemesterHolidays)
  .post(createHoliday);

router.route('/:id')
  .get(getHoliday)
  .put(updateHoliday)
  .delete(deleteHoliday);

export default router;
