import Invoice from '../models/invoice.model.js';
import logger from '../utils/logger.js';
import Product from '../models/product.model.js';

class InvoiceService {
    async getInvoices({ skip = 0, limit = 10 }, companyId = null) {
        try {
            const query = companyId ? { companyId } : {};
            const [invoices, total] = await Promise.all([
                Invoice.find(query)
                    .populate('companyId', 'name')
                    .populate('createdBy', 'name')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Invoice.countDocuments(query)
            ]);

            logger.info('Invoices fetched successfully', { 
                companyId,
                skip,
                limit,
                total
            });

            return { invoices, total };
        } catch (error) {
            logger.error('Error fetching invoices:', { error: error.message });
            throw error;
        }
    }

    async getInvoiceById(id, companyId = null) {
        try {
            const query = { _id: id };
            if (companyId) {
                query.companyId = companyId;
            }

            const invoice = await Invoice.findOne(query)
                .populate('companyId', 'name')
                .populate('createdBy', 'name')
                .populate('items.productId');

            if (!invoice) {
                logger.warn('Invoice not found:', { id, companyId });
                return null;
            }

            logger.info('Invoice fetched successfully:', { id });
            return invoice;
        } catch (error) {
            logger.error('Error fetching invoice:', { error: error.message, id });
            throw error;
        }
    }

    async createInvoice(data, userId, companyId) {
        try {
            const invoice = new Invoice({
                ...data,
                companyId,
                createdBy: userId
            });

            await invoice.save();

            logger.info('Invoice created successfully:', { 
                invoiceId: invoice._id,
                userId,
                companyId
            });

            return invoice;
        } catch (error) {
            logger.error('Error creating invoice:', { error: error.message });
            throw error;
        }
    }

    async updateInvoice(id, data, companyId) {
        try {
            const invoice = await Invoice.findOne({ _id: id, companyId });
            if (!invoice) {
                logger.warn('Invoice not found:', { id, companyId });
                return null;
            }

            Object.assign(invoice, data);
            await invoice.save();

            logger.info('Invoice updated successfully:', { id, companyId });
            return invoice;
        } catch (error) {
            logger.error('Error updating invoice:', { error: error.message, id });
            throw error;
        }
    }

    async deleteInvoice(id, companyId) {
        try {
            const invoice = await Invoice.findOne({ _id: id, companyId });
            if (!invoice) {
                logger.warn('Invoice not found:', { id, companyId });
                return false;
            }

            await invoice.deleteOne();

            logger.info('Invoice deleted successfully:', { id, companyId });
            return true;
        } catch (error) {
            logger.error('Error deleting invoice:', { error: error.message, id });
            throw error;
        }
    }

    async searchInvoices(query, companyId = null) {
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

            logger.info('Invoice search completed:', { 
                query,
                companyId,
                results: invoices.length
            });

            return invoices;
        } catch (error) {
            logger.error('Error searching invoices:', { error: error.message });
            throw error;
        }
    }
}

export default new InvoiceService(); 