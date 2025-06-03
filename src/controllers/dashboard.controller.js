import Invoice from '../models/invoice.model.js';
import Product from '../models/product.model.js';

export const getDashboard = async (req, res) => {
    try {
        const [totalInvoices, totalProducts] = await Promise.all([
            Invoice.countDocuments({ companyId: req.user.companyId }),
            Product.countDocuments({ companyId: req.user.companyId })
        ]);

        const recentInvoices = await Invoice.find({ companyId: req.user.companyId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('companyId', 'name');

        res.render('dashboard/index', {
            user: req.user,
            totalInvoices,
            totalProducts,
            recentInvoices
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect('/auth/login');
    }
}; 