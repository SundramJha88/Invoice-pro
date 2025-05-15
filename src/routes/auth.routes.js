import express from 'express';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('auth/login');
});

router.get('/register', async (req, res) => {
    try {
        const companies = await Company.find().select('name');
        res.render('auth/register', { companies });
    } catch (error) {
        res.render('auth/register', { 
            error: 'Error loading companies',
            companies: []
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.render('auth/login', { error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login', { error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/dashboard');
    } catch (error) {
        res.render('auth/login', { error: 'Server error' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, companyId } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const companies = await Company.find().select('name');
            return res.render('auth/register', { 
                error: 'Email already registered',
                companies
            });
        }

        const user = new User({
            name,
            email,
            password,
            companyId,
            role: 'user'
        });

        await user.save();
        
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/dashboard');
    } catch (error) {
        const companies = await Company.find().select('name');
        res.render('auth/register', { 
            error: 'Error creating account',
            companies
        });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
});

export default router;