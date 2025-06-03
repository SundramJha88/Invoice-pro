import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import logger from '../utils/logger.js';

export const register = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            confirmPassword,
            companyName,
            companyEmail,
            companyPhone,
            companyAddress
        } = req.body;

        if (!name || !email || !password || !confirmPassword || 
            !companyName || !companyEmail || !companyPhone || !companyAddress) {
            return res.render('auth/register', { 
                error: 'All fields are required',
                user: null
            });
        }

        if (password !== confirmPassword) {
            return res.render('auth/register', { 
                error: 'Passwords do not match',
                user: null
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('auth/register', { 
                error: 'Email already registered',
                user: null
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'user',
            isActive: true,
            isApproved: false,
            companyName,
            companyEmail,
            companyPhone,
            companyAddress
        });

        logger.info('New user registration:', { 
            userId: user._id,
            email: user.email,
            companyName: user.companyName
        });

        res.render('auth/register-success', {
            message: 'Registration successful! Please wait for admin approval.',
            user: null
        });

    } catch (error) {
        logger.error('Registration error:', { error: error.message });
        res.render('auth/register', { 
            error: 'Registration failed. Please try again.',
            user: null
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render('auth/login', { 
                error: 'Email and password are required',
                user: null
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', { 
                error: 'Invalid credentials',
                user: null
            });
        }

        if (!user.isApproved) {
            return res.render('auth/login', { 
                error: 'Your account is pending approval. Please wait for admin confirmation.',
                user: null
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('auth/login', { 
                error: 'Invalid credentials',
                user: null
            });
        }

        if (!user.companyId) {
            const company = await Company.create({
                name: user.companyName,
                email: user.companyEmail,
                phone: user.companyPhone,
                address: user.companyAddress,
                createdBy: user._id
            });

            user.companyId = company._id;
            await user.save();
        }

        req.session.userId = user._id;
        res.redirect('/dashboard');

    } catch (error) {
        logger.error('Login error:', { error: error.message });
        res.render('auth/login', { 
            error: 'Login failed. Please try again.',
            user: null
        });
    }
};

export const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error('Logout error:', { error: err.message });
        }
        res.redirect('/auth/login');
    });
}; 