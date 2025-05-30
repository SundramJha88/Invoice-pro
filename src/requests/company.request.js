import logger from '../utils/logger.js';

const validateCompany = (data) => {
    const errors = {};
    let isValid = true;

    // Name validation
    if (!data.name || data.name.trim() === '') {
        errors.name = 'Company name is required';
        isValid = false;
    } else if (data.name.length < 2) {
        errors.name = 'Company name must be at least 2 characters long';
        isValid = false;
    }

    // Email validation
    if (!data.email || data.email.trim() === '') {
        errors.email = 'Email is required';
        isValid = false;
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.email = 'Invalid email format';
            isValid = false;
        }
    }

    // Phone validation
    if (!data.phone || data.phone.trim() === '') {
        errors.phone = 'Phone number is required';
        isValid = false;
    } else {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(data.phone)) {
            errors.phone = 'Invalid phone number format';
            isValid = false;
        }
    }

    // Address validation
    if (!data.address || data.address.trim() === '') {
        errors.address = 'Address is required';
        isValid = false;
    }

    // GST Number validation (optional but must be valid if provided)
    if (data.gstNumber && data.gstNumber.trim() !== '') {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(data.gstNumber)) {
            errors.gstNumber = 'Invalid GST number format';
            isValid = false;
        }
    }

    // PAN Number validation (optional but must be valid if provided)
    if (data.panNumber && data.panNumber.trim() !== '') {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(data.panNumber)) {
            errors.panNumber = 'Invalid PAN number format';
            isValid = false;
        }
    }

    if (!isValid) {
        logger.warn('Company validation failed', { errors });
    }

    return {
        isValid,
        errors
    };
};

export { validateCompany };

export class CreateCompanyRequest {
    static rules() {
        return {
            name: {
                required: true,
                minLength: 2,
                message: 'Company name is required (min 2 chars)'
            },
            email: {
                required: true,
                pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                message: 'Valid email is required'
            },
            phone: {
                required: true,
                pattern: /^\d{10}$/,
                message: 'Valid 10-digit phone is required'
            },
            gstin: {
                required: true,
                pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                message: 'Valid GSTIN is required'
            },
            address: {
                required: true,
                minLength: 5,
                message: 'Address is required (min 5 chars)'
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
            if (rule.minLength && data[field] && data[field].length < rule.minLength) {
                errors[field] = rule.message;
            }
            if (rule.pattern && data[field] && !rule.pattern.test(data[field])) {
                errors[field] = rule.message;
            }
        }
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

export class UpdateCompanyRequest extends CreateCompanyRequest {
    static rules() {
        const rules = super.rules();
        // All fields optional for update, but if present, must be valid
        for (const key in rules) {
            rules[key].required = false;
        }
        return rules;
    }
} 