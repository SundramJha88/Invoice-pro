import Invoice from '../models/invoice.model.js';
import Company from '../models/company.model.js';
import Product from '../models/product.model.js';

export const getAllInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const invoices = await Invoice.find()
            .populate('companyId', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Invoice.countDocuments();

        res.render('invoice/index', {
            invoices,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalInvoices: total
        });
    } catch (error) {
        res.render('invoice/index', { error: 'Error fetching invoices' });
    }
};

export const getAddInvoiceForm = async (req, res) => {
    try {
        const companies = await Company.find().select('name');
        res.render('invoice/add', { companies });
    } catch (error) {
        res.redirect('/invoice');
    }
};

export const createInvoice = async (req, res) => {
    try {
        const invoice = new Invoice({
            ...req.body,
            createdBy: req.user._id,
            status: 'draft'
        });
        
        // Validate products exist and update stock
        for (const item of invoice.items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            if (product.inStock < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }
            // Update stock
            product.inStock -= item.quantity;
            await product.save();
        }
        
        await invoice.save();
        res.redirect('/invoice');
    } catch (error) {
        const companies = await Company.find().select('name');
        const products = await Product.find({ companyId: req.body.companyId }).select('name price');
        res.render('invoice/add', { 
            error: error.message || 'Error creating invoice',
            invoice: req.body,
            companies,
            products
        });
    }
};

export const getInvoiceDetails = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('companyId', 'name address email phone gstin');
        if (!invoice) {
            return res.redirect('/invoice');
        }
        res.render('invoice/details', { invoice });
    } catch (error) {
        res.redirect('/invoice');
    }
};

export const getEditInvoiceForm = async (req, res) => {
    try {
        const [invoice, companies] = await Promise.all([
            Invoice.findById(req.params.id),
            Company.find().select('name')
        ]);
        if (!invoice) {
            return res.redirect('/invoice');
        }
        res.render('invoice/edit', { invoice, companies });
    } catch (error) {
        res.redirect('/invoice');
    }
};

export const updateInvoice = async (req, res) => {
    try {
        await Invoice.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/invoice');
    } catch (error) {
        const companies = await Company.find().select('name');
        res.render('invoice/edit', { 
            error: 'Error updating invoice',
            invoice: { ...req.body, _id: req.params.id },
            companies
        });
    }
};

export const deleteInvoice = async (req, res) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);
        res.redirect('/invoice');
    } catch (error) {
        res.redirect('/invoice');
    }
};

export const getProductsByCompany = async (req, res) => {
    try {
        const products = await Product.find({ companyId: req.params.companyId })
            .select('name price taxRate inStock');
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products' });
    }
};