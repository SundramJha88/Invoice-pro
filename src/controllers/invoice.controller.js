import Invoice from '../models/invoice.model.js';
import Product from '../models/product.model.js';
import logger from '../utils/logger.js';
import { CreateInvoiceRequest, UpdateInvoiceRequest } from '../requests/invoice.request.js';

export const getAllInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const query = req.query.query || '';

        // Build search query
        const searchQuery = {};
        if (req.user.role !== 'admin') {
            searchQuery.companyId = req.user.companyId;
        }

        if (query) {
            searchQuery.$or = [
                { invoiceNumber: { $regex: query, $options: 'i' } },
                { 'companyId.name': { $regex: query, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const totalInvoices = await Invoice.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalInvoices / limit);

        // Get invoices with pagination and populate company details
        const invoices = await Invoice.find(searchQuery)
            .populate('companyId', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        logger.info('Invoices fetched successfully', { 
            userId: req.user._id,
            role: req.user.role,
            page,
            limit,
            total: totalInvoices
        });

        // Determine which template to use based on user role
        const template = req.user.role === 'admin' ? 'admin/invoices' : 'invoice/index';

        res.render(template, {
            invoices,
            currentPage: page,
            totalPages,
            query,
            user: req.user,
            title: 'Manage Invoices'
        });
    } catch (error) {
        logger.error('Error fetching invoices:', { 
            error: error.message,
            stack: error.stack,
            userId: req.user._id
        });
        res.status(500).render('error', { 
            error: 'Failed to fetch invoices',
            user: req.user
        });
    }
};

export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('companyId', 'name')
            .populate('createdBy', 'name')
            .populate('items.productId');

        if (!invoice) {
            logger.warn('Invoice not found:', { invoiceId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Invoice not found',
                error: { status: 404 },
                user: req.user
            });
        }

        if (req.user.role === 'user' && invoice.companyId._id.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized invoice access:', { 
                userId: req.user._id,
                invoiceId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 },
                user: req.user
            });
        }

        logger.info('Invoice fetched successfully:', { 
            invoiceId: req.params.id,
            userId: req.user._id
        });

        res.render('invoice/view', { invoice, user: req.user });
    } catch (error) {
        logger.error('Error fetching invoice:', { 
            error: error.message,
            invoiceId: req.params.id
        });
        res.status(500).render('error', { 
            message: 'Failed to fetch invoice',
            error: { status: 500 },
            user: req.user
        });
    }
};

export const getAddInvoiceForm = async (req, res) => {
    try {
        const products = await Product.find({ 
            companyId: req.user.companyId,
            isActive: true 
        }).select('name price taxRate inStock');

        const companies = await Product.find({ 
            isActive: true 
        }).select('name');

        logger.info('Add invoice form fetched:', { 
            userId: req.user._id,
            productsCount: products.length,
            companiesCount: companies.length
        });

        res.render('invoice/add', { 
            user: req.user,
            products,
            companies
        });
    } catch (error) {
        logger.error('Error fetching add invoice form:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Failed to load invoice form',
            error: { status: 500 },
            user: req.user
        });
    }
};

export const createInvoice = async (req, res) => {
    try {
        const validation = CreateInvoiceRequest.validate(req.body);
        if (!validation.isValid) {
            logger.warn('Invalid invoice data:', { 
                errors: validation.errors,
                userId: req.user._id
            });
            return res.status(400).render('invoice/add', {
                error: Object.values(validation.errors)[0],
                formData: req.body,
                user: req.user
            });
        }

        const invoice = new Invoice({
            ...req.body,
            companyId: req.user.role === 'admin' ? req.body.companyId : req.user.companyId,
            createdBy: req.user._id
        });
        
        await invoice.save();

        logger.info('Invoice created successfully:', { 
            invoiceId: invoice._id,
            userId: req.user._id
        });

        res.redirect('/invoice');
    } catch (error) {
        logger.error('Error creating invoice:', { 
            error: error.message,
            userId: req.user._id
        });
        res.status(500).render('invoice/add', {
            error: 'Failed to create invoice',
            formData: req.body,
            user: req.user
        });
    }
};

export const getEditInvoiceForm = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('companyId', 'name')
            .populate('createdBy', 'name')
            .populate('items.productId');

        if (!invoice) {
            logger.warn('Invoice not found:', { invoiceId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Invoice not found',
                error: { status: 404 },
                user: req.user
            });
        }

        if (req.user.role === 'user' && invoice.companyId._id.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized invoice access:', { 
                userId: req.user._id,
                invoiceId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 },
                user: req.user
            });
        }

        const products = await Product.find({ 
            companyId: req.user.companyId,
            isActive: true 
        }).select('name price taxRate inStock');

        logger.info('Edit invoice form fetched:', { 
            invoiceId: req.params.id,
            userId: req.user._id
        });

        res.render('invoice/edit', { 
            user: req.user,
            invoice,
            products 
        });
    } catch (error) {
        logger.error('Error fetching edit invoice form:', { 
            error: error.message,
            invoiceId: req.params.id
        });
        res.status(500).render('error', { 
            message: 'Failed to load edit form',
            error: { status: 500 },
            user: req.user
        });
    }
};

export const updateInvoice = async (req, res) => {
    try {
        const validation = UpdateInvoiceRequest.validate(req.body);
        if (!validation.isValid) {
            logger.warn('Invalid invoice data:', { 
                errors: validation.errors,
                invoiceId: req.params.id
            });
            return res.status(400).render('invoice/edit', {
                error: Object.values(validation.errors)[0],
                invoice: req.body,
                user: req.user
            });
        }

        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            logger.warn('Invoice not found:', { invoiceId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Invoice not found',
                error: { status: 404 },
                user: req.user
            });
        }

        if (req.user.role === 'user' && invoice.companyId.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized invoice update:', { 
                userId: req.user._id,
                invoiceId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 },
                user: req.user
            });
        }

        Object.assign(invoice, req.body);
        await invoice.save();

        logger.info('Invoice updated successfully:', { 
            invoiceId: req.params.id,
            userId: req.user._id
        });

        res.redirect('/invoice');
    } catch (error) {
        logger.error('Error updating invoice:', { 
            error: error.message,
            invoiceId: req.params.id
        });
        res.status(500).render('invoice/edit', {
            error: 'Failed to update invoice',
            invoice: req.body,
            user: req.user
        });
    }
};

export const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            logger.warn('Invoice not found:', { invoiceId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Invoice not found',
                error: { status: 404 },
                user: req.user
            });
        }

        if (req.user.role === 'user' && invoice.companyId.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized invoice deletion:', { 
                userId: req.user._id,
                invoiceId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 },
                user: req.user
            });
        }

        await invoice.deleteOne();

        logger.info('Invoice deleted successfully:', { 
            invoiceId: req.params.id,
            userId: req.user._id
        });

        res.redirect('/invoice');
    } catch (error) {
        logger.error('Error deleting invoice:', { 
            error: error.message,
            invoiceId: req.params.id
        });
        res.status(500).render('error', { 
            message: 'Failed to delete invoice',
            error: { status: 500 },
            user: req.user
        });
    }
};

export const searchInvoices = async (req, res) => {
    try {
        const query = req.query.query || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = {};
        if (req.user.role !== 'admin') {
            searchQuery.companyId = req.user.companyId;
        }

        if (query) {
            searchQuery.$or = [
                { invoiceNumber: { $regex: query, $options: 'i' } },
                { 'companyId.name': { $regex: query, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const totalInvoices = await Invoice.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalInvoices / limit);

        // Get invoices with pagination and populate company details
        const invoices = await Invoice.find(searchQuery)
            .populate('companyId', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        logger.info('Invoices search completed:', { 
            userId: req.user._id,
            role: req.user.role,
            query,
            page,
            limit,
            total: totalInvoices
        });

        // Determine which template to use based on user role
        const template = req.user.role === 'admin' ? 'admin/invoices' : 'invoice/index';

        res.render(template, {
            invoices,
            currentPage: page,
            totalPages,
            query,
            user: req.user,
            title: 'Search Invoices'
        });
    } catch (error) {
        logger.error('Error searching invoices:', { 
            error: error.message,
            stack: error.stack,
            userId: req.user._id
        });
        res.status(500).render('error', { 
            error: 'Failed to search invoices',
            user: req.user
        });
    }
};

export const getProductsByCompany = async (req, res) => {
    try {
        const products = await Product.find({ 
            companyId: req.params.companyId,
            isActive: true 
        }).select('name price taxRate inStock');

        logger.info('Products fetched for company:', { 
            companyId: req.params.companyId,
            count: products.length
        });

        res.json(products);
    } catch (error) {
        logger.error('Error fetching products:', { 
            error: error.message,
            companyId: req.params.companyId
        });
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const getCompanyInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Get total count of invoices
        const totalInvoices = await Invoice.countDocuments({ companyId: req.user.companyId });
        
        // Get counts for different statuses
        const paidInvoices = await Invoice.countDocuments({ 
            companyId: req.user.companyId,
            status: 'paid'
        });
        
        const pendingInvoices = await Invoice.countDocuments({ 
            companyId: req.user.companyId,
            status: 'pending'
        });
        
        const overdueInvoices = await Invoice.countDocuments({ 
            companyId: req.user.companyId,
            status: 'overdue'
        });

        // Get paginated invoices
        const invoices = await Invoice.find({ companyId: req.user.companyId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('companyId', 'name');

        const totalPages = Math.ceil(totalInvoices / limit);

        res.render('invoice/index', {
            invoices,
            currentPage: page,
            totalPages,
            totalInvoices,
            paidInvoices,
            pendingInvoices,
            overdueInvoices,
            query: req.query.query || '',
            user: req.user
        });
    } catch (error) {
        console.error('Error in getCompanyInvoices:', error);
        res.status(500).render('error', { 
            message: 'Error fetching invoices',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.user
        });
    }
};