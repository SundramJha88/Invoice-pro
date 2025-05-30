import Invoice from '../models/invoice.model.js';
import Product from '../models/product.model.js';
import logger from '../utils/logger.js';
import { CreateInvoiceRequest, UpdateInvoiceRequest } from '../requests/invoice.request.js';

export const getAllInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = req.user.role === 'admin' ? {} : { companyId: req.user.companyId };
        const [invoices, total] = await Promise.all([
            Invoice.find(query)
            .populate('companyId', 'name')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
            .skip(skip)
                .limit(limit),
            Invoice.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limit);

        logger.info('Invoices fetched successfully', { 
            userId: req.user._id,
            role: req.user.role,
            page,
            limit,
            total
        });

        res.render('invoice/index', {
            invoices,
            currentPage: page,
            totalPages,
            total,
            user: req.user
        });
    } catch (error) {
        logger.error('Error fetching invoices:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Failed to fetch invoices',
            error: { status: 500 }
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
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && invoice.companyId._id.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized invoice access:', { 
                userId: req.user._id,
                invoiceId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
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
            error: { status: 500 }
        });
    }
};

export const getAddInvoiceForm = async (req, res) => {
    try {
        const products = await Product.find({ 
            companyId: req.user.companyId,
            isActive: true 
        }).select('name price taxRate inStock');

        logger.info('Add invoice form fetched:', { 
            userId: req.user._id,
            productsCount: products.length
        });

        res.render('invoice/add', { 
            user: req.user,
            products 
        });
    } catch (error) {
        logger.error('Error fetching add invoice form:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Failed to load invoice form',
            error: { status: 500 }
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
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && invoice.companyId._id.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized invoice access:', { 
                userId: req.user._id,
                invoiceId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
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
            error: { status: 500 }
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
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && invoice.companyId.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized invoice update:', { 
                userId: req.user._id,
                invoiceId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
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
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && invoice.companyId.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized invoice deletion:', { 
                userId: req.user._id,
                invoiceId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
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
            error: { status: 500 }
        });
    }
};

export const searchInvoices = async (req, res) => {
    try {
        const { query } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const searchQuery = {
            $or: [
                { invoiceNumber: { $regex: query, $options: 'i' } },
                { 'clientDetails.name': { $regex: query, $options: 'i' } },
                { 'clientDetails.email': { $regex: query, $options: 'i' } }
            ]
        };

        if (req.user.role === 'user') {
            searchQuery.companyId = req.user.companyId;
        }

        const [invoices, total] = await Promise.all([
            Invoice.find(searchQuery)
                .populate('companyId', 'name')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Invoice.countDocuments(searchQuery)
        ]);

        const totalPages = Math.ceil(total / limit);

        logger.info('Invoice search completed:', { 
            query,
            userId: req.user._id,
            results: invoices.length
        });

        res.render('invoice/index', {
            invoices,
            currentPage: page,
            totalPages,
            total,
            searchQuery: query,
            user: req.user
        });
    } catch (error) {
        logger.error('Error searching invoices:', { 
            error: error.message,
            query: req.query.query
        });
        res.status(500).render('error', { 
            message: 'Failed to search invoices',
            error: { status: 500 }
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
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { companyId: req.params.companyId };
        const [invoices, total] = await Promise.all([
            Invoice.find(query)
                .populate('companyId', 'name')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Invoice.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limit);

        logger.info('Company invoices fetched successfully', { 
            companyId: req.params.companyId,
            page,
            limit,
            total
        });

        res.render('invoice/index', {
            invoices,
            currentPage: page,
            totalPages,
            total,
            user: req.user
        });
    } catch (error) {
        logger.error('Error fetching company invoices:', { 
            error: error.message,
            companyId: req.params.companyId
        });
        res.status(500).render('error', { 
            message: 'Failed to fetch company invoices',
            error: { status: 500 }
        });
    }
};