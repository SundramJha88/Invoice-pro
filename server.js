import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PORT } from './src/config/index.js';
import connectDb from './src/config/connectDb.js';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.routes.js';
import companyRoutes from './src/routes/company.routes.js';
import invoiceRoutes from './src/routes/invoice.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
connectDb();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/auth', authRoutes);
app.use('/company', companyRoutes);
app.use('/invoice', invoiceRoutes);

const port = PORT || 4040;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});