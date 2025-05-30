import express from 'express';
import { 
    getAllInvoices,
    getAddInvoiceForm,
    createInvoice,
    getEditInvoiceForm,
    updateInvoice,
    deleteInvoice,
    getInvoiceDetails,
    getProductsByCompany
} from '../controllers/invoice.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import Product from '../models/product.model.js';

const router = express.Router();

router.use(auth);
router.get('/', getAllInvoices);
router.get('/add', getAddInvoiceForm);
router.post('/add', createInvoice);
router.get('/:id', getInvoiceDetails);
router.get('/edit/:id', getEditInvoiceForm);
router.post('/update/:id', updateInvoice);
router.get('/delete/:id', deleteInvoice);
router.get('/products/:companyId', getProductsByCompany);

export default router;