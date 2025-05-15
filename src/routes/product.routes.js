import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import Product from '../models/product.model.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const products = await Product.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments();

        res.render('product/index', {
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalProducts: total
        });
    } catch (error) {
        res.render('product/index', { error: 'Error fetching products' });
    }
});

router.get('/add', (req, res) => {
    res.render('product/add');
});

router.post('/', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.redirect('/product');
    } catch (error) {
        res.render('product/add', { 
            error: 'Error creating product',
            product: req.body 
        });
    }
});

router.get('/edit/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.redirect('/product');
        }
        res.render('product/edit', { product });
    } catch (error) {
        res.redirect('/product');
    }
});

router.post('/update/:id', async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/product');
    } catch (error) {
        res.render('product/edit', { 
            error: 'Error updating product',
            product: { ...req.body, _id: req.params.id }
        });
    }
});

router.get('/delete/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/product');
    } catch (error) {
        res.redirect('/product');
    }
});

export default router;