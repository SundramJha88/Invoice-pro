import express from 'express';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';
import { auth, admin } from '../middlewares/auth.middleware.js';
import logger from '../utils/logger.js';
import { register, login, logout } from '../controllers/auth.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

// Show registration form (public)
router.get('/register', (req, res) => {
    res.render('auth/register', { 
        error: null,
        user: null
    });
});

// Handle registration (public)
router.post('/register', register);

// Show login form (public)
router.get('/login', (req, res) => {
    res.render('auth/login', { 
        error: null,
        user: null
    });
});

// Handle login (public)
router.post('/login', login);

// Handle logout
router.get('/logout', logout);

export default router;