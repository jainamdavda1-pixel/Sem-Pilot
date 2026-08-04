import { Router } from 'express';
import semesterRoutes from './semester.routes.js';
import subjectRoutes from './subject.routes.js';
import lectureRoutes from './lecture.routes.js';
import attendanceRoutes from './attendance.routes.js';
import holidayRoutes from './holiday.routes.js';
import authRoutes from './auth.routes.js';
import facultyRoutes from './faculty.routes.js';
import importRoutes from './import.routes.js';
import classroomRoutes from './classroom.routes.js';
import assignmentRoutes from './assignment.routes.js';
import aiRoutes from './ai.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/import', importRoutes);
router.use('/imports', importRoutes);
router.use('/semester', semesterRoutes);
router.use('/semesters', semesterRoutes);
router.use('/faculty', facultyRoutes);
router.use('/faculties', facultyRoutes);
router.use('/subjects', subjectRoutes);
router.use('/lectures', lectureRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/holidays', holidayRoutes);
router.use('/classroom', classroomRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);

export default router;

