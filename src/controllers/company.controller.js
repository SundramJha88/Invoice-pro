import Company from '../models/company.model.js';

export const getAllCompanies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const companies = await Company.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Company.countDocuments();

        res.render('company/index', {
            companies,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCompanies: total
        });
    } catch (error) {
        res.render('company/index', { error: 'Error fetching companies' });
    }
};

export const getAddCompanyForm = (req, res) => {
    res.render('company/add');
};

export const createCompany = async (req, res) => {
    try {
        const company = new Company(req.body);
        await company.save();
        res.redirect('/company');
    } catch (error) {
        res.render('company/add', { 
            error: 'Error creating company',
            company: req.body 
        });
    }
};

export const getEditCompanyForm = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.redirect('/company');
        }
        res.render('company/edit', { company });
    } catch (error) {
        res.redirect('/company');
    }
};

export const updateCompany = async (req, res) => {
    try {
        await Company.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/company');
    } catch (error) {
        res.render('company/edit', { 
            error: 'Error updating company',
            company: { ...req.body, _id: req.params.id }
        });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        await Company.findByIdAndDelete(req.params.id);
        res.redirect('/company');
    } catch (error) {
        res.redirect('/company');
    }
};