import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    clientDetails: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        taxRate: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        subtotal: {
            type: Number,
            required: true
        },
        taxAmount: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    taxAmount: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft'
    },
    date: {
        type: Date,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    notes: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ companyId: 1 });
invoiceSchema.index({ 'clientDetails.email': 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ date: 1 });
invoiceSchema.index({ dueDate: 1 });

invoiceSchema.pre('save', function(next) {
    let subtotal = 0;
    let taxAmount = 0;

    this.items.forEach(item => {
        item.subtotal = item.quantity * item.price;
        item.taxAmount = item.subtotal * (item.taxRate / 100);
        item.total = item.subtotal + item.taxAmount;

        subtotal += item.subtotal;
        taxAmount += item.taxAmount;
    });

    this.subtotal = subtotal;
    this.taxAmount = taxAmount;
    this.total = subtotal + taxAmount;

    next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;