import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import { MONGO_URI } from '../config/index.js';

async function createAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        let company = await Company.findOne({ email: 'admin@example.com' });
        if (!company) {
            company = await Company.create({
                name: 'Admin Company',
                email: 'admin@example.com',
                phone: '+1234567890',
                address: '123 Admin St, Admin City',
                createdBy: null
            });
            console.log('Created default company');
        }

        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
            isActive: true,
            isApproved: true,
            companyId: company._id
        });

        company.createdBy = admin._id;
        await company.save();

        console.log('Admin user created successfully');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin(); 