import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import serviceRoutes from './routes/services';
import adminRoutes from './routes/admin';
import './config/passport';
import "dotenv/config";

import { db } from './config/firebase.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Database check middleware
app.use('/api', (req, res, next) => {
  if (!db && req.path !== '/health') {
    return res.status(503).json({ 
      message: 'Service Unavailable', 
      details: 'Database connection not established. Check server logs and environment variables.' 
    });
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'firebase' });
});

// Export for Vercel
export default app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (Firebase Mode)`);
  });
}
