import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import serviceRoutes from './routes/services';
import adminRoutes from './routes/admin';
import './config/passport'; // Initialize passport strategies

import "dotenv/config";
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });

export const prisma = new PrismaClient({ adapter });
const app = express();

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err: any) => {
  console.error('❌ Server failed to start:', err);
});
