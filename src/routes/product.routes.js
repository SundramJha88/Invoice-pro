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
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/test', (req, res) => {
    res.json({ message: 'Product routes are working' });
});

router.use(auth);

router.use((req, res, next) => {
    logger.info('Product route accessed:', {
        path: req.path,
        method: req.method,
        user: req.user ? {
            id: req.user._id,
            role: req.user.role,
            email: req.user.email
        } : 'No user'
    });
    next();
});

router.get('/admin/search', admin, searchProducts);
router.get('/admin/add', admin, getAddProductForm);
router.post('/admin/add', admin, createProduct);
router.get('/admin/edit/:id', admin, getEditProductForm);
router.get('/admin/:id', admin, getProductById);
router.put('/admin/:id', admin, updateProduct);
router.delete('/admin/:id', admin, deleteProduct);
router.get('/admin', admin, getAllProducts);

router.get('/:id', user, getProductById);
router.get('/', user, getAllProducts);

export default router;