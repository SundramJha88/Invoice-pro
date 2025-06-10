import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [2, 'Product name must be at least 2 characters long']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        trim: true,
        required: [true, 'Category is required']
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        trim: true,
        enum: {
            values: ['piece', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack'],
            message: '{VALUE} is not a valid unit'
        }
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative'],
        get: v => Math.round(v * 100) / 100
    },
    taxRate: {
        type: Number,
        required: [true, 'Tax rate is required'],
        min: [0, 'Tax rate cannot be negative'],
        max: [100, 'Tax rate cannot exceed 100%'],
        get: v => Math.round(v * 100) / 100
    },
    inStock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock quantity cannot be negative'],
        default: 0,
        get: v => Math.round(v)
    },
    lowStockAlert: {
        type: Number,
        default: 10,
        min: [0, 'Low stock alert cannot be negative']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company ID is required']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator ID is required']
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Create compound index for name and companyId
productSchema.index({ name: 1, companyId: 1 }, { 
    unique: true,
    partialFilterExpression: { isActive: true }
});

productSchema.index({ companyId: 1, category: 1 });
productSchema.index({ companyId: 1, isActive: 1 });
productSchema.index({ companyId: 1, inStock: 1 });

productSchema.virtual('taxAmount').get(function() {
    return Math.round((this.price * this.taxRate / 100) * 100) / 100;
});

productSchema.virtual('totalPrice').get(function() {
    return Math.round((this.price + this.taxAmount) * 100) / 100;
});

productSchema.pre('save', function(next) {
    if (this.isModified('inStock') && this.inStock <= this.lowStockAlert) {
        console.log(`Low stock alert for product: ${this.name}`);
    }
    next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;