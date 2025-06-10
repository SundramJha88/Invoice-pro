import Product from '../models/product.model.js';
import Company from '../models/company.model.js';
import logger from '../utils/logger.js';
import { CreateProductRequest, UpdateProductRequest } from '../requests/product.request.js';

export const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = req.user.role === 'admin' ? {} : { companyId: req.user.companyId };
        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('companyId', 'name')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Product.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limit);

        logger.info('Products fetched successfully', { 
            userId: req.user._id,
            role: req.user.role,
            page,
            limit,
            total
        });

        if (req.user.role === 'admin') {
            res.render('product/admin/index', {
                products,
                currentPage: page,
                totalPages,
                total,
                user: req.user,
                error: null,
                query: req.query.query || ''
            });
        } else {
            res.render('product/index', {
                products,
                currentPage: page,
                totalPages,
                total,
                user: req.user,
                error: null
            });
        }
    } catch (error) {
        logger.error('Error fetching products:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Failed to fetch products',
            error: { status: 500 }
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('companyId', 'name')
            .populate('createdBy', 'name');

        if (!product) {
            logger.warn('Product not found:', { productId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Product not found',
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && product.companyId._id.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized product access:', { 
                userId: req.user._id,
                productId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
            });
        }

        logger.info('Product fetched successfully:', { 
            productId: req.params.id,
            userId: req.user._id
        });

        res.render('product/view', { product, user: req.user });
    } catch (error) {
        logger.error('Error fetching product:', { 
            error: error.message,
            productId: req.params.id
        });
        res.status(500).render('error', { 
            message: 'Failed to fetch product',
            error: { status: 500 }
        });
    }
};

export const getAddProductForm = async (req, res) => {
    try {
        logger.info('Add product form request received:', { 
            userId: req.user._id,
            role: req.user.role,
            email: req.user.email
        });

        if (!req.user || (req.user.role !== 'admin' && req.user.email !== 'admin@invoicepro.com')) {
            logger.warn('Unauthorized access to add product form:', { 
                userId: req.user?._id,
                role: req.user?.role,
                email: req.user?.email
            });
            return res.status(403).render('error', {
                message: 'Access denied. Admin privileges required.',
                error: { status: 403 }
            });
        }

        let companies = [];
        if (req.user.role === 'admin') {
            companies = await Company.find({ isActive: true }).sort({ name: 1 });
        }

        res.render('product/add', { 
            user: req.user,
            error: null,
            validationErrors: null,
            formData: null,
            title: 'Add New Product',
            companies
        });
    } catch (error) {
        logger.error('Error fetching add product form:', { 
            error: error.message,
            stack: error.stack
        });
        res.status(500).render('error', { 
            message: 'Failed to load product form',
            error: { status: 500 }
        });
    }
};

export const createProduct = async (req, res) => {
    try {
        logger.info('Create product request received:', {
            body: req.body,
            userId: req.user._id,
            role: req.user.role,
            email: req.user.email
        });

        const validation = CreateProductRequest.validate(req.body);
        if (!validation.isValid) {
            logger.warn('Invalid product data:', { 
                errors: validation.errors,
                userId: req.user._id,
                body: req.body
            });

            return res.status(400).render('product/add', {
                error: 'Please fix the errors below',
                validationErrors: validation.errors,
                formData: req.body,
                user: req.user,
                title: 'Add New Product'
            });
        }

        let companyId;
        if (req.user.role === 'admin') {
            // Find default company for admin
            const defaultCompany = await Company.findOne({ 
                name: 'Default Company',
                isActive: true 
            });

            if (!defaultCompany) {
                // Create default company if it doesn't exist
                const newCompany = new Company({
                    name: 'Default Company',
                    email: 'default@company.com',
                    phone: '0000000000',
                    isActive: true,
                    createdBy: req.user._id
                });
                await newCompany.save();
                companyId = newCompany._id;
            } else {
                companyId = defaultCompany._id;
            }
        } else {
            companyId = req.user.companyId;
        }

        const existingProduct = await Product.findOne({
            name: req.body.name.trim(),
            companyId: companyId,
            isActive: true
        });

        if (existingProduct) {
            logger.warn('Product with same name exists:', {
                name: req.body.name,
                companyId: companyId
            });

            return res.status(400).render('product/add', {
                error: 'A product with this name already exists',
                formData: req.body,
                user: req.user,
                title: 'Add New Product'
            });
        }

        const product = new Product({
            name: req.body.name.trim(),
            description: req.body.description?.trim() || '',
            category: req.body.category.trim(),
            unit: req.body.unit,
            price: parseFloat(req.body.price),
            taxRate: parseFloat(req.body.taxRate),
            inStock: parseInt(req.body.inStock),
            isActive: req.body.isActive === 'on',
            companyId: companyId,
            createdBy: req.user._id
        });
        
        await product.save();

        logger.info('Product created successfully:', { 
            productId: product._id,
            userId: req.user._id,
            product: product
        });

        req.flash('success', 'Product added successfully');
        res.redirect('/products/admin');
    } catch (error) {
        logger.error('Error creating product:', { 
            error: error.message,
            stack: error.stack,
            userId: req.user._id,
            body: req.body
        });

        if (error.code === 11000) {
            return res.status(400).render('product/add', {
                error: 'A product with this name already exists',
                formData: req.body,
                user: req.user,
                title: 'Add New Product'
            });
        }

        if (error.name === 'ValidationError') {
            const validationErrors = {};
            for (const field in error.errors) {
                validationErrors[field] = error.errors[field].message;
            }
            return res.status(400).render('product/add', {
                error: 'Please fix the validation errors below',
                validationErrors,
                formData: req.body,
                user: req.user,
                title: 'Add New Product'
            });
        }

        res.status(500).render('product/add', {
            error: 'Failed to create product. Please try again.',
            formData: req.body,
            user: req.user,
            title: 'Add New Product'
        });
    }
};

export const getEditProductForm = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('companyId', 'name')
            .populate('createdBy', 'name');

        if (!product) {
            logger.warn('Product not found:', { productId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Product not found',
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && product.companyId._id.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized product access:', { 
                userId: req.user._id,
                productId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
            });
        }

        logger.info('Edit product form fetched:', { 
            productId: req.params.id,
            userId: req.user._id
        });

        res.render('product/edit', { 
            user: req.user,
            product
        });
    } catch (error) {
        logger.error('Error fetching edit product form:', { 
            error: error.message,
            productId: req.params.id
        });
        res.status(500).render('error', { 
            message: 'Failed to load edit form',
            error: { status: 500 }
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const validation = UpdateProductRequest.validate(req.body);
        if (!validation.isValid) {
            logger.warn('Invalid product data:', { 
                errors: validation.errors,
                productId: req.params.id
            });
            return res.status(400).render('product/edit', {
                error: Object.values(validation.errors)[0],
                product: req.body,
                user: req.user
            });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            logger.warn('Product not found:', { productId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Product not found',
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && product.companyId.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized product update:', { 
                userId: req.user._id,
                productId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
            });
        }

        Object.assign(product, req.body);
        await product.save();

        logger.info('Product updated successfully:', { 
            productId: req.params.id,
            userId: req.user._id
        });

        res.redirect('/products/admin');
    } catch (error) {
        logger.error('Error updating product:', { 
            error: error.message,
            productId: req.params.id
        });
        res.status(500).render('product/edit', {
            error: 'Failed to update product',
            product: req.body,
            user: req.user
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            logger.warn('Product not found:', { productId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Product not found',
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && product.companyId.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized product deletion:', { 
                userId: req.user._id,
                productId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
            });
        }

        await product.deleteOne();

        logger.info('Product deleted successfully:', { 
            productId: req.params.id,
            userId: req.user._id
        });

        res.redirect('/products/admin');
    } catch (error) {
        logger.error('Error deleting product:', { 
            error: error.message,
            productId: req.params.id
        });
        res.status(500).render('error', { 
            message: 'Failed to delete product',
            error: { status: 500 }
        });
    }
};

export const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const searchQuery = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { sku: { $regex: query, $options: 'i' } }
            ]
        };

        if (req.user.role === 'user') {
            searchQuery.companyId = req.user.companyId;
        }

        const [products, total] = await Promise.all([
            Product.find(searchQuery)
                .populate('companyId', 'name')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Product.countDocuments(searchQuery)
        ]);

        const totalPages = Math.ceil(total / limit);

        logger.info('Products search completed:', { 
            userId: req.user._id,
            query,
            total
        });

        res.render('product/index', {
            products,
            currentPage: page,
            totalPages,
            total,
            query,
            user: req.user
        });
    } catch (error) {
        logger.error('Error searching products:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Failed to search products',
            error: { status: 500 }
        });
    }
}; 