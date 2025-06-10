import Company from '../models/company.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Invoice from '../models/invoice.model.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';

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
            recentInvoices: recentInvoices.map(invoice => ({
                ...invoice.toObject(),
                companyName: invoice.companyId?.name || 'No Company'
            })),
            recentUsers: recentUsers.map(user => ({
                ...user.toObject(),
                companyName: user.companyId?.name || 'No Company'
            }))
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
        const query = req.query.query || '';

        // Build search query
        const searchQuery = {
            isActive: true
        };

        if (query) {
            searchQuery.$or = [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const totalUsers = await User.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalUsers / limit);

        // Get users with pagination and populate company details
        const users = await User.find(searchQuery)
            .populate('companyId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Transform users data to include company name
        const transformedUsers = users.map(user => ({
            ...user.toObject(),
            company: user.companyId ? { name: user.companyId.name } : null
        }));

        res.render('admin/users', {
            users: transformedUsers,
            currentPage: page,
            totalPages,
            query,
            user: req.user,
            title: 'Manage Users'
        });
    } catch (error) {
        logger.error('Error fetching users:', { 
            error: error.message,
            stack: error.stack,
            userId: req.user._id
        });
        res.status(500).render('error', { 
            error: 'Failed to fetch users',
            user: req.user
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

        if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Cannot modify other admin users' });
        }

        if (role) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;
        if (typeof isApproved === 'boolean') user.isApproved = isApproved;

        await user.save();

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

export const getProfile = async (req, res) => {
    try {
        res.render('admin/profile', {
            user: req.user,
            error: req.query.error,
            success: req.query.success
        });
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).render('error', { 
            message: 'Error loading profile',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name;
        user.phone = phone;

        // If the user is an admin, set default values for company fields
        if (user.role === 'admin') {
            user.companyName = user.companyName || 'Admin Company';
            user.companyEmail = user.companyEmail || 'admin@invoicepro.com';
            user.companyPhone = user.companyPhone || '1234567890';
            user.companyAddress = user.companyAddress || 'Admin Address';
        }

        await user.save();

        res.redirect('/admin/profile?success=Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.redirect('/admin/profile?success=Password updated successfully');
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 