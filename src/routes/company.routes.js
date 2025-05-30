import express from 'express';
import { 
    getAllCompanies,
    getAddCompanyForm,
    createCompany,
    getEditCompanyForm,
    updateCompany,
    deleteCompany,
    searchCompanies
} from '../controllers/company.controller.js';

import { auth, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Regular user routes (view only)
router.get('/', getAllCompanies);
router.get('/search', searchCompanies);

// Admin only routes
router.get('/add', admin, getAddCompanyForm);
router.post('/', admin, createCompany);
router.get('/edit/:id', admin, getEditCompanyForm);
router.post('/:id', admin, updateCompany);
router.get('/delete/:id', admin, deleteCompany);

export default router;