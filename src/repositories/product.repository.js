import Product from '../models/product.model.js';

class ProductRepository {
    async create(data) {
        try {
            const product = new Product(data);
            return await product.save();
        } catch (error) {
            throw error;
        }
    }

    async findById(id) {
        try {
            return await Product.findById(id);
        } catch (error) {
            throw error;
        }
    }

    async findAll(query = {}, options = {}) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            const products = await Product.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await Product.countDocuments(query);

            return {
                products,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw error;
        }
    }

    async update(id, data) {
        try {
            return await Product.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        try {
            return await Product.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }

    async search(query) {
        try {
            return await Product.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            });
        } catch (error) {
            throw error;
        }
    }
}

export default new ProductRepository(); 