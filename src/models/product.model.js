import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    sku: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    unit: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    inStock: {
        type: Number,
        default: 0,
        min: 0
    },
    lowStockAlert: {
        type: Number,
        default: 10,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Product', productSchema);