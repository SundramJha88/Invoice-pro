import Company from '../models/company.model.js';
import logger from '../utils/logger.js';
import { validateCompany } from '../requests/company.request.js';
import User from '../models/user.model.js';

export const getAllCompanies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const query = req.query.query || '';

        // Build search query
        const searchQuery = {
            isActive: true
        };

        if (query) {
            searchQuery.$or = [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const totalCompanies = await Company.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCompanies / limit);

        // Get companies with pagination
        const companies = await Company.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get user count for each company
        const companiesWithUserCount = await Promise.all(companies.map(async (company) => {
            const userCount = await User.countDocuments({ companyId: company._id });
            return {
                ...company.toObject(),
                userCount
            };
        }));

        res.render('admin/companies', {
            companies: companiesWithUserCount,
            currentPage: page,
            totalPages,
            query,
            user: req.user,
            title: 'Manage Companies'
        });
    } catch (error) {
        logger.error('Error fetching companies:', { 
            error: error.message,
            stack: error.stack,
            userId: req.user._id
        });
        res.status(500).render('error', { 
            error: 'Failed to fetch companies',
            user: req.user
        });
    }
};

export const getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('createdBy', 'name');

        if (!company) {
            logger.warn('Company not found:', { companyId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Company not found',
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && company._id.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized company access:', { 
                userId: req.user._id,
                companyId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
            });
        }

        logger.info('Company fetched successfully:', { 
            companyId: req.params.id,
            userId: req.user._id
        });

        res.render('company/view', { company, user: req.user });
    } catch (error) {
        logger.error('Error fetching company:', { 
            error: error.message,
            companyId: req.params.id
        });
        res.status(500).render('error', { 
            message: 'Failed to fetch company',
            error: { status: 500 }
        });
    }
};

export const getAddCompanyForm = async (req, res) => {
    try {
        logger.info('Add company form fetched:', { 
            userId: req.user._id
        });

        res.render('company/add', { 
            user: req.user
        });
    } catch (error) {
        logger.error('Error fetching add company form:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Failed to load company form',
            error: { status: 500 }
        });
    }
};

export const createCompany = async (req, res) => {
    try {
        const { error } = validateCompany(req.body);
        if (error) {
            logger.warn('Invalid company data:', { 
                errors: error.details,
                userId: req.user._id
            });
            return res.status(400).render('company/add', {
                error: error.details[0].message,
                formData: req.body,
                user: req.user
            });
        }

        const company = new Company({
            ...req.body,
            createdBy: req.user._id
        });
        
        await company.save();

        logger.info('Company created successfully:', { 
            companyId: company._id,
            userId: req.user._id
        });

        res.redirect('/company');
    } catch (error) {
        logger.error('Error creating company:', { 
            error: error.message,
            userId: req.user._id
        });
        res.status(500).render('company/add', {
            error: 'Failed to create company',
            formData: req.body,
            user: req.user
        });
    }
};

export const getEditCompanyForm = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('createdBy', 'name');

        if (!company) {
            logger.warn('Company not found:', { companyId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Company not found',
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && company._id.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized company access:', { 
                userId: req.user._id,
                companyId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
            });
        }

        logger.info('Edit company form fetched:', { 
            companyId: req.params.id,
            userId: req.user._id
        });

        res.render('company/edit', { 
            user: req.user,
            company
        });
    } catch (error) {
        logger.error('Error fetching edit company form:', { 
            error: error.message,
            companyId: req.params.id
        });
        res.status(500).render('error', { 
            message: 'Failed to load edit form',
            error: { status: 500 }
        });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { error } = validateCompany(req.body);
        if (error) {
            logger.warn('Invalid company data:', { 
                errors: error.details,
                companyId: req.params.id
            });
            return res.status(400).render('company/edit', {
                error: error.details[0].message,
                company: req.body,
                user: req.user
            });
        }

        const company = await Company.findById(req.params.id);
        if (!company) {
            logger.warn('Company not found:', { companyId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Company not found',
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && company._id.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized company update:', { 
                userId: req.user._id,
                companyId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
            });
        }

        Object.assign(company, req.body);
        await company.save();

        logger.info('Company updated successfully:', { 
            companyId: req.params.id,
            userId: req.user._id
        });

        res.redirect('/company');
    } catch (error) {
        logger.error('Error updating company:', { 
            error: error.message,
            companyId: req.params.id
        });
        res.status(500).render('company/edit', {
            error: 'Failed to update company',
            company: req.body,
            user: req.user
        });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            logger.warn('Company not found:', { companyId: req.params.id });
            return res.status(404).render('error', { 
                message: 'Company not found',
                error: { status: 404 }
            });
        }

        if (req.user.role === 'user' && company._id.toString() !== req.user.companyId.toString()) {
            logger.warn('Unauthorized company deletion:', { 
                userId: req.user._id,
                companyId: req.params.id
            });
            return res.status(403).render('error', { 
                message: 'Access denied',
                error: { status: 403 }
            });
        }

        await company.deleteOne();

        logger.info('Company deleted successfully:', { 
            companyId: req.params.id,
            userId: req.user._id
        });

        res.redirect('/company');
    } catch (error) {
        logger.error('Error deleting company:', { 
            error: error.message,
            companyId: req.params.id
        });
        res.status(500).render('error', { 
            message: 'Failed to delete company',
            error: { status: 500 }
        });
    }
};

export const searchCompanies = async (req, res) => {
    try {
        const { query } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const searchQuery = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } }
            ]
        };

        if (req.user.role === 'user') {
            searchQuery._id = req.user.companyId;
        }

        const [companies, total] = await Promise.all([
            Company.find(searchQuery)
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Company.countDocuments(searchQuery)
        ]);

        const totalPages = Math.ceil(total / limit);

        logger.info('Companies search completed:', { 
            userId: req.user._id,
            query,
            total
        });

        res.render('company/index', {
            companies,
            currentPage: page,
            totalPages,
            total,
            query,
            user: req.user
        });
    } catch (error) {
        logger.error('Error searching companies:', { error: error.message });
        res.status(500).render('error', { 
            message: 'Failed to search companies',
            error: { status: 500 }
        });
    }
};