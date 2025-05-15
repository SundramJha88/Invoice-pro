import dotenv from "dotenv";
dotenv.config();
export const PORT = process.env.PORT ?? 4040;
export const JWT_SECRET = process.env.JWT_SECRET?? 'secret';
export const NODE_ENV = process.env.NODE_ENV ?? 'production';
export const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/invoice-pro'