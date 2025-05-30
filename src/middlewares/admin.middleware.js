import logger from '../utils/logger.js';

export const admin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            logger.warn('Unauthorized admin access attempt', { userId: req.user?._id });
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        next();
    } catch (error) {
        logger.error('Admin middleware error', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    }
}; 