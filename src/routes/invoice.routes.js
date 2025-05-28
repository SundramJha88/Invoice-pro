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
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(auth);
router.get('/', getAllInvoices);
router.get('/add', getAddInvoiceForm);
router.post('/add', createInvoice);
router.get('/:id', getInvoiceDetails);
router.get('/edit/:id', getEditInvoiceForm);
router.post('/update/:id', updateInvoice);
router.get('/delete/:id', deleteInvoice);
router.get('/products/:companyId', async (req, res) => {
    try {
        const products = await Product.find({ 
            companyId: req.params.companyId,
            isActive: true 
        }).select('name price taxRate');
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products' });
    }
});
export default router;