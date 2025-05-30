import express from 'express';
import { auth, admin, user } from '../middlewares/auth.middleware.js';
import { 
    getAllInvoices,
    getCompanyInvoices,
    getAddInvoiceForm,
    createInvoice,
    getEditInvoiceForm,
    updateInvoice,
    deleteInvoice,
    getProductsByCompany,
    searchInvoices,
    getInvoiceById
} from '../controllers/invoice.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Admin routes (full CRUD access)
router.get('/admin', admin, getAllInvoices);
router.get('/admin/:id', admin, getInvoiceById);
router.get('/admin/add', admin, getAddInvoiceForm);
router.post('/admin', admin, createInvoice);
router.get('/admin/edit/:id', admin, getEditInvoiceForm);
router.post('/admin/:id', admin, updateInvoice);
router.get('/admin/delete/:id', admin, deleteInvoice);
router.get('/admin/search', admin, searchInvoices);

// User routes (view only)
router.get('/', user, getCompanyInvoices);
router.get('/:id', user, getInvoiceById);
router.get('/products/:companyId', user, getProductsByCompany);

export default router;