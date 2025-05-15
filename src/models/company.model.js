import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  gstin: {
    type: String,
    trim: true
  },
  pan: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Company = mongoose.model('Company', companySchema);
export default Company;