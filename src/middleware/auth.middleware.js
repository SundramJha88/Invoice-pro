import User from '../models/user.model.js';

export const isAuthenticated = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
            return res.redirect('/auth/login');
        }

        if (!user.isActive) {
            req.session.destroy();
            return res.render('auth/login', {
                error: 'Your account has been deactivated. Please contact support.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.redirect('/auth/login');
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.redirect('/auth/login');
        }

        if (req.user.role !== 'admin') {
            return res.status(403).render('error', {
                message: 'Access denied',
                error: { status: 403 }
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.redirect('/auth/login');
    }
}; 