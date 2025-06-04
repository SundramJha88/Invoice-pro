import express from 'express';
import { auth, admin, user } from '../middlewares/auth.middleware.js';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getAddProductForm,
    getEditProductForm
} from '../controllers/product.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Admin routes
router.get('/admin', admin, getAllProducts);
router.get('/admin/add', admin, getAddProductForm);
router.post('/admin/add', admin, createProduct);
router.get('/admin/edit/:id', admin, getEditProductForm);
router.get('/admin/search', admin, searchProducts);
router.get('/admin/:id', admin, getProductById);
router.put('/admin/:id', admin, updateProduct);
router.delete('/admin/:id', admin, deleteProduct);

// User routes
router.get('/', user, getAllProducts);
router.get('/:id', user, getProductById);

// Debug route
router.get('/debug', (req, res) => {
    res.json({
        message: 'Product routes are working',
        user: req.user ? {
            id: req.user._id,
            role: req.user.role,
            email: req.user.email
        } : null
    });
});

export default router;