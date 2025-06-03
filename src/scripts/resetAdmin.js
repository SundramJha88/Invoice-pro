import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import { MONGO_URI } from '../config/index.js';

async function resetAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        await User.deleteOne({ email: 'admin@example.com' });
        await Company.deleteOne({ email: 'admin@example.com' });

        const company = await Company.create({
            name: 'Admin Company',
            email: 'admin@example.com',
            phone: '+1234567890',
            address: '123 Admin St, Admin City'
        });

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

        console.log('Admin user and company reset successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting admin:', error);
        process.exit(1);
    }
}

resetAdmin(); 