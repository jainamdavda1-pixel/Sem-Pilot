import { Router } from 'express';
import { 
  parseWorkbook, 
  confirmImport,
  importClassroomAssignments,
  importClassroomCourses,
  getSyncStatus
} from '../controllers/import.controller.js';

const router = Router();

router.post('/workbook', parseWorkbook);
router.post('/confirm', confirmImport);
router.post('/classroom/assignments', importClassroomAssignments);
router.post('/classroom/courses', importClassroomCourses);
router.get('/classroom/sync-status', getSyncStatus);

export default router;
