import express from 'express';
import { auth, admin, user } from '../middlewares/auth.middleware.js';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts
} from '../controllers/product.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Admin routes (full CRUD access)
router.get('/admin', admin, getAllProducts);
router.get('/admin/search', admin, searchProducts);
router.get('/admin/:id', admin, getProductById);
router.post('/admin', admin, createProduct);
router.put('/admin/:id', admin, updateProduct);
router.delete('/admin/:id', admin, deleteProduct);

// User routes (view only)
router.get('/', user, getAllProducts);
router.get('/:id', user, getProductById);

export default router;