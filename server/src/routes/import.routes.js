import { Router } from 'express';
import { parseWorkbook, confirmImport } from '../controllers/import.controller.js';

const router = Router();

router.post('/workbook', parseWorkbook);
router.post('/confirm', confirmImport);

export default router;
