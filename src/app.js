import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import productRoutes from './routes/product.routes.js';
import { MONGODB_URI, SESSION_SECRET } from './config/index.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Debug middleware to log all requests
app.use((req, res, next) => {
    logger.info('Incoming request:', {
        method: req.method,
        path: req.path,
        user: req.user ? {
            id: req.user._id,
            role: req.user.role,
            email: req.user.email
        } : null
    });
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/products', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Application error:', err);
    res.status(500).render('error', {
        message: 'Something went wrong',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res, next) => {
    logger.warn('Page not found:', {
        method: req.method,
        path: req.path,
        user: req.user ? {
            id: req.user._id,
            role: req.user.role,
            email: req.user.email
        } : null
    });
    res.status(404).render('error', {
        message: 'Page not found',
        error: { status: 404 }
    });
});

export default app; 