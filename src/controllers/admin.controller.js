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

        const users = await User.find()
            .populate('companyId')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalUsers = await User.countDocuments();
        const totalPages = Math.ceil(totalUsers / limit);

        res.render('admin/users', {
            users,
            currentPage: page,
            totalPages,
            user: req.user
        });
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).render('error', { 
            message: 'Error fetching users',
            error: error.message
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, isActive, isApproved } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent modifying other admin users
        if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Cannot modify other admin users' });
        }

        // Update user fields
        if (role) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;
        if (typeof isApproved === 'boolean') user.isApproved = isApproved;

        await user.save();

        // If user is approved and doesn't have a company, create one
        if (user.isApproved && !user.companyId) {
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

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        logger.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting other admin users
        if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Cannot delete other admin users' });
        }

        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
}; 