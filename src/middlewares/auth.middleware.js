import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';

export const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            logger.warn('No token found in cookies');
            return res.redirect('/auth/login');
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId).populate('companyId');
            
            if (!user || !user.isActive) {
                logger.warn('Invalid or inactive user:', { userId: decoded.userId });
                res.clearCookie('token');
                return res.redirect('/auth/login');
            }

            if (user.email === 'admin@invoicepro.com') {
                user.role = 'admin';
            }

            req.user = user;
            logger.info('User authenticated:', { 
                userId: user._id,
                role: user.role,
                email: user.email
            });
            next();
        } catch (jwtError) {
            logger.error('JWT verification failed:', { error: jwtError.message });
            res.clearCookie('token');
            return res.redirect('/auth/login');
        }
    } catch (error) {
        logger.error('Auth middleware error:', { error: error.message });
        res.clearCookie('token');
        res.redirect('/auth/login');
    }
};

export const admin = async (req, res, next) => {
    try {
        if (!req.user) {
            logger.warn('No user found in request');
            return res.status(401).redirect('/auth/login');
        }

        const isAdmin = req.user.role === 'admin' || req.user.email === 'admin@invoicepro.com';
        
        if (!isAdmin) {
            logger.warn('Unauthorized admin access attempt:', { 
                userId: req.user._id,
                role: req.user.role,
                email: req.user.email
            });
            return res.status(403).render('error', { 
                message: 'Access denied. Admin privileges required.',
                error: { status: 403 }
            });
        }

        if (req.user.email === 'admin@invoicepro.com' && req.user.role !== 'admin') {
            req.user.role = 'admin';
        }

        logger.info('Admin access granted:', { 
            userId: req.user._id,
            role: req.user.role,
            email: req.user.email
        });
        next();
    } catch (error) {
        logger.error('Admin middleware error:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Internal server error',
            error: { status: 500 }
        });
    }
};

export const user = async (req, res, next) => {
    try {
        if (!req.user) {
            logger.warn('No user found in request');
            return res.status(401).redirect('/auth/login');
        }

        if (req.user.role !== 'user' && req.user.email !== 'admin@invoicepro.com') {
            logger.warn('Unauthorized user access attempt:', { 
                userId: req.user._id,
                role: req.user.role,
                email: req.user.email
            });
            return res.status(403).render('error', { 
                message: 'Access denied. User privileges required.',
                error: { status: 403 }
            });
        }

        if (!req.user.companyId && req.user.email !== 'admin@invoicepro.com') {
            logger.warn('User without company access attempt:', { 
                userId: req.user._id,
                role: req.user.role,
                email: req.user.email
            });
            return res.status(403).render('error', { 
                message: 'Access denied. No company assigned.',
                error: { status: 403 }
            });
        }

        logger.info('User access granted:', { 
            userId: req.user._id,
            role: req.user.role,
            email: req.user.email
        });
        next();
    } catch (error) {
        logger.error('User middleware error:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Internal server error',
            error: { status: 500 }
        });
    }
};