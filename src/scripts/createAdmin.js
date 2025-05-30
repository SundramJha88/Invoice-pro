import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import { MONGO_URI } from '../config/index.js';

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Create a default company if it doesn't exist
        let company = await Company.findOne({ name: 'Admin Company' });
        if (!company) {
            company = await Company.create({
                name: 'Admin Company',
                email: 'admin@company.com',
                phone: '1234567890',
                address: 'Admin Address',
                isActive: true,
                createdBy: null // temporary, will update after admin user is created
            });
            console.log('Created default company');
        }

        // Check if admin user exists
        const adminExists = await User.findOne({ email: 'admin@invoicepro.com' });
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@invoicepro.com',
            password: hashedPassword,
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
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdminUser(); 