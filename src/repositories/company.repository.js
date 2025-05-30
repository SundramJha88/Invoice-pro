import Company from '../models/company.model.js';

class CompanyRepository {
    async create(data) {
        try {
            const company = new Company(data);
            return await company.save();
        } catch (error) {
            throw error;
        }
    }

    async findById(id) {
        try {
            return await Company.findById(id);
        } catch (error) {
            throw error;
        }
    }

    async findAll(query = {}, options = {}) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            const companies = await Company.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await Company.countDocuments(query);
            const totalPages = Math.ceil(total / limit);

            return {
                companies,
                total,
                page,
                totalPages
            };
        } catch (error) {
            throw error;
        }
    }

    async update(id, data) {
        try {
            return await Company.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        try {
            return await Company.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }

    async search(query) {
        try {
            const searchRegex = new RegExp(query, 'i');
            return await Company.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex }
                ]
            });
        } catch (error) {
            throw error;
        }
    }
}

export default new CompanyRepository(); 