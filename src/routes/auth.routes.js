import express from 'express';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';
import { auth, admin } from '../middlewares/auth.middleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Public routes
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// Protected routes
router.get('/register', auth, admin, async (req, res) => {
    try {
        const companies = await Company.find().select('name');
        res.render('auth/register', { 
            companies,
            user: req.user
        });
    } catch (error) {
        logger.error('Error loading registration form:', { error: error.message });
        res.render('auth/register', { 
            error: 'Error loading companies',
            companies: [],
            user: req.user
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).populate('companyId');
        
        if (!user) {
            return res.render('auth/login', { error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login', { error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true });

        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/admin');
        } else {
        res.redirect('/dashboard');
        }
    } catch (error) {
        logger.error('Login error:', { error: error.message });
        res.render('auth/login', { error: 'Server error' });
    }
});

router.post('/register', auth, admin, async (req, res) => {
    try {
        const { name, email, password, companyId, role } = req.body;
        
        if (!name || !email || !password || !companyId) {
            const companies = await Company.find().select('name');
            return res.render('auth/register', { 
                error: 'All fields are required',
                companies,
                user: req.user
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const companies = await Company.find().select('name');
            return res.render('auth/register', { 
                error: 'Email already registered',
                companies,
                user: req.user
            });
        }

        const user = new User({
            name,
            email,
            password,
            companyId,
            role: role || 'user'
        });

        await user.save();
        
        logger.info('New user registered by admin:', { 
            adminId: req.user._id,
            newUserId: user._id
        });

        res.redirect('/admin');
    } catch (error) {
        logger.error('Registration error:', { error: error.message });
        const companies = await Company.find().select('name');
        res.render('auth/register', { 
            error: 'Error creating account: ' + error.message,
            companies,
            user: req.user
        });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
});

export default router;