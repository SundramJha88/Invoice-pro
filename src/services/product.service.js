import productRepository from '../repositories/product.repository.js';
import logger from '../utils/logger.js';

class ProductService {
    async createProduct(data) {
        try {
            logger.info('Creating new product', { data });
            const product = await productRepository.create(data);
            logger.info('Product created successfully', { productId: product._id });
            return product;
        } catch (error) {
            logger.error('Error creating product', { error: error.message });
            throw error;
        }
    }

    async getProductById(id) {
        try {
            logger.info('Fetching product by ID', { productId: id });
            const product = await productRepository.findById(id);
            if (!product) {
                logger.warn('Product not found', { productId: id });
                throw new Error('Product not found');
            }
            return product;
        } catch (error) {
            logger.error('Error fetching product', { error: error.message });
            throw error;
        }
    }

    async getAllProducts(query = {}, options = {}) {
        try {
            logger.info('Fetching all products', { query, options });
            const result = await productRepository.findAll(query, options);
            return result;
        } catch (error) {
            logger.error('Error fetching products', { error: error.message });
            throw error;
        }
    }

    async updateProduct(id, data) {
        try {
            logger.info('Updating product', { productId: id, data });
            const product = await productRepository.update(id, data);
            if (!product) {
                logger.warn('Product not found for update', { productId: id });
                throw new Error('Product not found');
            }
            logger.info('Product updated successfully', { productId: id });
            return product;
        } catch (error) {
            logger.error('Error updating product', { error: error.message });
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            logger.info('Deleting product', { productId: id });
            const product = await productRepository.delete(id);
            if (!product) {
                logger.warn('Product not found for deletion', { productId: id });
                throw new Error('Product not found');
            }
            logger.info('Product deleted successfully', { productId: id });
            return product;
        } catch (error) {
            logger.error('Error deleting product', { error: error.message });
            throw error;
        }
    }

    async searchProducts(query) {
        try {
            logger.info('Searching products', { query });
            const products = await productRepository.search(query);
            return products;
        } catch (error) {
            logger.error('Error searching products', { error: error.message });
            throw error;
        }
    }
}

export default new ProductService(); 