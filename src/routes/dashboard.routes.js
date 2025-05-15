import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
    try {
        res.render('dashboard/index');
    } catch (error) {
        res.redirect('/auth/login');
    }
});

export default router;