import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { getDashboard } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(auth);
router.get('/', getDashboard);

export default router;