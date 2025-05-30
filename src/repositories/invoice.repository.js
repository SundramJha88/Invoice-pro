import Invoice from '../models/invoice.model.js';
import logger from '../utils/logger.js';

class InvoiceRepository {
    async create(data) {
        try {
            const invoice = new Invoice(data);
            await invoice.save();
            logger.info('Invoice created in repository:', { invoiceId: invoice._id });
            return invoice;
        } catch (error) {
            logger.error('Error creating invoice in repository:', { error: error.message });
            throw error;
        }
    }

    async find(conditions = {}, options = {}) {
        try {
            const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
            const invoices = await Invoice.find(conditions)
                .populate('companyId', 'name')
                .populate('createdBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(limit);
            
            logger.info('Invoices found in repository:', { count: invoices.length });
            return invoices;
        } catch (error) {
            logger.error('Error finding invoices in repository:', { error: error.message });
            throw error;
        }
    }

    async findOne(conditions) {
        try {
            const invoice = await Invoice.findOne(conditions)
                .populate('companyId', 'name')
                .populate('createdBy', 'name')
                .populate('items.productId');
            
            if (!invoice) {
                logger.warn('Invoice not found in repository:', { conditions });
                return null;
            }

            logger.info('Invoice found in repository:', { invoiceId: invoice._id });
            return invoice;
        } catch (error) {
            logger.error('Error finding invoice in repository:', { error: error.message });
            throw error;
        }
    }

    async update(conditions, data) {
        try {
            const invoice = await Invoice.findOne(conditions);
            if (!invoice) {
                logger.warn('Invoice not found for update in repository:', { conditions });
                return null;
            }

            Object.assign(invoice, data);
            await invoice.save();

            logger.info('Invoice updated in repository:', { invoiceId: invoice._id });
            return invoice;
        } catch (error) {
            logger.error('Error updating invoice in repository:', { error: error.message });
            throw error;
        }
    }

    async delete(conditions) {
        try {
            const invoice = await Invoice.findOne(conditions);
            if (!invoice) {
                logger.warn('Invoice not found for deletion in repository:', { conditions });
                return null;
            }

            await invoice.deleteOne();
            logger.info('Invoice deleted from repository:', { invoiceId: invoice._id });
            return invoice;
        } catch (error) {
            logger.error('Error deleting invoice in repository:', { error: error.message });
            throw error;
        }
    }

    async count(conditions = {}) {
        try {
            const count = await Invoice.countDocuments(conditions);
            logger.info('Invoice count in repository:', { count });
            return count;
        } catch (error) {
            logger.error('Error counting invoices in repository:', { error: error.message });
            throw error;
        }
    }

    async search(query, companyId = null) {
        try {
            const searchQuery = {
                $or: [
                    { invoiceNumber: { $regex: query, $options: 'i' } },
                    { 'clientDetails.name': { $regex: query, $options: 'i' } },
                    { 'clientDetails.email': { $regex: query, $options: 'i' } }
                ]
            };

            if (companyId) {
                searchQuery.companyId = companyId;
            }

            const invoices = await Invoice.find(searchQuery)
                .populate('companyId', 'name')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 });

            logger.info('Invoices searched in repository:', { 
                query,
                results: invoices.length
            });

            return invoices;
        } catch (error) {
            logger.error('Error searching invoices in repository:', { error: error.message });
            throw error;
        }
    }
}

export default new InvoiceRepository(); 