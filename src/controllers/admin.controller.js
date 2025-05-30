import Company from '../models/company.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Invoice from '../models/invoice.model.js';
import logger from '../utils/logger.js';

export const getAdminDashboard = async (req, res) => {
    try {
        const [companies, users, products, invoices, recentInvoices, recentUsers] = await Promise.all([
            Company.countDocuments(),
            User.countDocuments(),
            Product.countDocuments(),
            Invoice.countDocuments(),
            Invoice.find()
                .populate('companyId', 'name')
                .sort({ createdAt: -1 })
                .limit(5),
            User.find()
                .populate('companyId', 'name')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        const stats = {
            companies,
            users,
            products,
            invoices
        };

        logger.info('Admin dashboard accessed:', { 
            userId: req.user._id,
            stats
        });

        res.render('admin/index', {
            user: req.user,
            stats,
            recentInvoices,
            recentUsers
        });
    } catch (error) {
        logger.error('Error accessing admin dashboard:', { 
            error: error.message,
            userId: req.user._id
        });
        res.status(500).render('error', { 
            message: 'Failed to load admin dashboard',
            error: { status: 500 }
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find()
                .populate('companyId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments()
        ]);

        res.render('admin/users', {
            user: req.user,
            users,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        logger.error('Error fetching users:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Failed to load users',
            error: { status: 500 }
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, isActive } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from modifying other admins
        if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Cannot modify other admin users' });
        }

        user.role = role;
        user.isActive = isActive;
        await user.save();

        logger.info('User updated by admin:', { 
            adminId: req.user._id,
            userId: user._id,
            updates: { role, isActive }
        });

        res.redirect('/admin/users');
    } catch (error) {
        logger.error('Error updating user:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Failed to update user',
            error: { status: 500 }
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting other admins
        if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Cannot delete other admin users' });
        }

        await user.remove();

        logger.info('User deleted by admin:', { 
            adminId: req.user._id,
            userId: user._id
        });

        res.redirect('/admin/users');
    } catch (error) {
        logger.error('Error deleting user:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Failed to delete user',
            error: { status: 500 }
        });
    }
}; 