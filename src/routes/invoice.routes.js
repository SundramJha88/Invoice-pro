import express from 'express';
import { 
    getAllInvoices,
    getAddInvoiceForm,
    createInvoice,
    getEditInvoiceForm,
    updateInvoice,
    deleteInvoice,
    getInvoiceDetails
} from '../controllers/invoice.controller.js';

const router = express.Router();

router.get('/', getAllInvoices);
router.get('/add', getAddInvoiceForm);
router.post('/', createInvoice);
router.get('/:id', getInvoiceDetails);
router.get('/edit/:id', getEditInvoiceForm);
router.post('/update/:id', updateInvoice);
router.get('/delete/:id', deleteInvoice);

export default router;