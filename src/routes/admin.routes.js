import express from 'express';
import { auth, admin } from '../middlewares/auth.middleware.js';
import { 
    getAdminDashboard, 
    getUsers, 
    updateUser, 
    deleteUser 
} from '../controllers/admin.controller.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Admin login routes (public)
router.get('/login', (req, res) => {
    res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // First find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            logger.warn('Admin login attempt with non-existent email:', { email });
            return res.render('admin/login', { error: 'Invalid credentials' });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            logger.warn('Non-admin user attempted admin login:', { userId: user._id });
            return res.render('admin/login', { error: 'Access denied. Admin privileges required.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn('Admin login attempt with wrong password:', { userId: user._id });
            return res.render('admin/login', { error: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            logger.warn('Inactive admin attempted login:', { userId: user._id });
            return res.render('admin/login', { error: 'Account is inactive. Please contact support.' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true });

        logger.info('Admin login successful:', { userId: user._id });
        res.redirect('/admin');
    } catch (error) {
        logger.error('Admin login error:', { error: error.message });
        res.render('admin/login', { error: 'Server error' });
    }
});

// Protected admin routes
router.use(auth);
router.use(admin);

// Admin dashboard
router.get('/', getAdminDashboard);

// User management routes
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router; 