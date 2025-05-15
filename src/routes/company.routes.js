import express from 'express';
import { 
    getAllCompanies,
    getAddCompanyForm,
    createCompany,
    getEditCompanyForm,
    updateCompany,
    deleteCompany
} from '../controllers/company.controller.js';

const router = express.Router();

router.get('/', getAllCompanies);
router.get('/add', getAddCompanyForm);
router.post('/', createCompany);
router.get('/edit/:id', getEditCompanyForm);
router.post('/update/:id', updateCompany);
router.get('/delete/:id', deleteCompany);

export default router;