import companyRepository from '../repositories/company.repository.js';
import logger from '../utils/logger.js';

class CompanyService {
    async createCompany(data) {
        try {
            logger.info('Creating new company', { data });
            const company = await companyRepository.create(data);
            logger.info('Company created successfully', { companyId: company._id });
            return company;
        } catch (error) {
            logger.error('Error creating company', { error: error.message });
            throw error;
        }
    }

    async getCompanyById(id) {
        try {
            logger.info('Fetching company by ID', { companyId: id });
            const company = await companyRepository.findById(id);
            if (!company) {
                logger.warn('Company not found', { companyId: id });
                throw new Error('Company not found');
            }
            return company;
        } catch (error) {
            logger.error('Error fetching company', { error: error.message });
            throw error;
        }
    }

    async getAllCompanies(query = {}, options = {}) {
        try {
            logger.info('Fetching all companies', { query, options });
            const result = await companyRepository.findAll(query, options);
            return result;
        } catch (error) {
            logger.error('Error fetching companies', { error: error.message });
            throw error;
        }
    }

    async updateCompany(id, data) {
        try {
            logger.info('Updating company', { companyId: id, data });
            const company = await companyRepository.update(id, data);
            if (!company) {
                logger.warn('Company not found for update', { companyId: id });
                throw new Error('Company not found');
            }
            logger.info('Company updated successfully', { companyId: id });
            return company;
        } catch (error) {
            logger.error('Error updating company', { error: error.message });
            throw error;
        }
    }

    async deleteCompany(id) {
        try {
            logger.info('Deleting company', { companyId: id });
            const company = await companyRepository.delete(id);
            if (!company) {
                logger.warn('Company not found for deletion', { companyId: id });
                throw new Error('Company not found');
            }
            logger.info('Company deleted successfully', { companyId: id });
            return company;
        } catch (error) {
            logger.error('Error deleting company', { error: error.message });
            throw error;
        }
    }

    async searchCompanies(query) {
        try {
            logger.info('Searching companies', { query });
            const companies = await companyRepository.search(query);
            return companies;
        } catch (error) {
            logger.error('Error searching companies', { error: error.message });
            throw error;
        }
    }
}

export default new CompanyService(); 