import { Router } from 'express';
import { googleAuth, getUserData } from '../controllers/auth.controller.js';

const router = Router();

router.post('/google', googleAuth);
router.get('/user-data/:userId', getUserData);

export default router;
