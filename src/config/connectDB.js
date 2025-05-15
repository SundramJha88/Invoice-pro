import mongoose from 'mongoose';
import { MONGO_URI } from './index.js';

const connectDb = async () => {
  try {
    const connection = await mongoose.connect(MONGO_URI);
    console.log(
      'Database connected successfully 🥳 on',
      connection.connection.host
    );
  } catch (error) {
    console.error('Database connection error 😢', error);
    process.exit(1);
  }
};

connectDb();

export default connectDb;