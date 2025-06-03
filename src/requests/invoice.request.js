export class CreateInvoiceRequest {
    static rules() {
        return {
            invoiceNumber: {
                required: true,
                unique: 'invoices',
                pattern: /^INV-\d{6}$/,
                message: 'Invoice number must be in format INV-XXXXXX'
            },
            date: {
                required: true,
                type: 'date',
                message: 'Valid date is required'
            },
            dueDate: {
                required: true,
                type: 'date',
                message: 'Valid due date is required'
            },
            items: {
                required: true,
                type: 'array',
                min: 1,
                message: 'At least one item is required'
            },
            'items.*.productId': {
                required: true,
                type: 'string',
                message: 'Product ID is required'
            },
            'items.*.quantity': {
                required: true,
                type: 'number',
                min: 1,
                message: 'Quantity must be at least 1'
            },
            'items.*.price': {
                required: true,
                type: 'number',
                min: 0,
                message: 'Price must be a positive number'
            },
            'items.*.taxRate': {
                required: true,
                type: 'number',
                min: 0,
                max: 100,
                message: 'Tax rate must be between 0 and 100'
            }
        };
    }

    static validate(data) {
        const rules = this.rules();
        const errors = {};

        for (const [field, rule] of Object.entries(rules)) {
            if (rule.required && !data[field]) {
                errors[field] = rule.message;
            }
        }

        if (data.invoiceNumber && !rule.pattern.test(data.invoiceNumber)) {
            errors.invoiceNumber = rule.message;
        }

        if (data.date && isNaN(Date.parse(data.date))) {
            errors.date = rules.date.message;
        }
        if (data.dueDate && isNaN(Date.parse(data.dueDate))) {
            errors.dueDate = rules.dueDate.message;
        }

        if (data.items) {
            if (!Array.isArray(data.items) || data.items.length === 0) {
                errors.items = rules.items.message;
            } else {
                data.items.forEach((item, index) => {
                    if (!item.productId) {
                        errors[`items.${index}.productId`] = rules['items.*.productId'].message;
                    }
                    if (!item.quantity || item.quantity < 1) {
                        errors[`items.${index}.quantity`] = rules['items.*.quantity'].message;
                    }
                    if (!item.price || item.price < 0) {
                        errors[`items.${index}.price`] = rules['items.*.price'].message;
                    }
                    if (!item.taxRate || item.taxRate < 0 || item.taxRate > 100) {
                        errors[`items.${index}.taxRate`] = rules['items.*.taxRate'].message;
                    }
                });
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

export class UpdateInvoiceRequest extends CreateInvoiceRequest {
    static rules() {
        const rules = super.rules();
        rules.invoiceNumber.required = false;
        return rules;
    }
} 