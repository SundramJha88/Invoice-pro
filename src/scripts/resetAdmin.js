import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import { MONGO_URI } from '../config/index.js';

async function resetAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Delete existing admin user and company
        await User.deleteOne({ email: 'admin@invoicepro.com' });
        await Company.deleteOne({ name: 'Admin Company' });
        console.log('Deleted existing admin user and company');

        // Create new company
        const company = await Company.create({
            name: 'Admin Company',
            email: 'admin@company.com',
            phone: '1234567890',
            address: 'Admin Address',
            isActive: true
        });
        console.log('Created new admin company');

        // Create new admin user (password will be hashed by the User model)
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@invoicepro.com',
            password: 'admin123', // Will be hashed by the User model
            role: 'admin',
            companyId: company._id,
            isActive: true
        });

        // Update company with createdBy
        company.createdBy = admin._id;
        await company.save();

        console.log('Admin user created successfully');
        console.log('Email: admin@invoicepro.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error resetting admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetAdmin(); 