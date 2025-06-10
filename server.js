import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PORT } from './src/config/index.js';
import connectDb from './src/config/connectDb.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
connectDb();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

import authRoutes from './src/routes/auth.routes.js';
import companyRoutes from './src/routes/company.routes.js';
import invoiceRoutes from './src/routes/invoice.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import productRoutes from './src/routes/product.routes.js';
import adminRoutes from './src/routes/admin.routes.js';

app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminRoutes);

app.use('/auth', authRoutes);
app.use('/company', companyRoutes);
app.use('/invoice', invoiceRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/products', productRoutes);

app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

const port = PORT || 4040;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
