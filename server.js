import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PORT } from './src/config/index.js';
import connectDb from './src/config/connectDb.js';


const app = express();
connectDb();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Invoice Pro API' });
});
const port = PORT || 4040;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});