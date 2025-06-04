export class CreateProductRequest {
    static rules() {
        return {
            name: {
                required: true,
                minLength: 2,
                message: 'Product name is required (min 2 chars)'
            },
            category: {
                required: true,
                message: 'Category is required'
            },
            unit: {
                required: true,
                message: 'Unit is required'
            },
            price: {
                required: true,
                type: 'number',
                min: 0,
                message: 'Price must be a positive number'
            },
            taxRate: {
                required: true,
                type: 'number',
                min: 0,
                max: 100,
                message: 'Tax rate must be between 0 and 100'
            },
            inStock: {
                required: true,
                type: 'number',
                min: 0,
                message: 'Stock must be a non-negative number'
            }
        };
    }

    static validate(data) {
        const rules = this.rules();
        const errors = {};
        for (const [field, rule] of Object.entries(rules)) {
            if (rule.required && (data[field] === undefined || data[field] === null || data[field] === '')) {
                errors[field] = rule.message;
            }
            if (rule.minLength && data[field] && data[field].length < rule.minLength) {
                errors[field] = rule.message;
            }
            if (rule.type === 'number' && data[field] !== undefined && isNaN(Number(data[field]))) {
                errors[field] = rule.message;
            }
            if (rule.min !== undefined && Number(data[field]) < rule.min) {
                errors[field] = rule.message;
            }
            if (rule.max !== undefined && Number(data[field]) > rule.max) {
                errors[field] = rule.message;
            }
        }
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

export class UpdateProductRequest extends CreateProductRequest {
    static rules() {
        const rules = super.rules();
        for (const key in rules) {
            rules[key].required = false;
        }
        return rules;
    }
} 