// This is the Vercel Serverless Function entry point.
// It wraps the entire Express app so all /api/* routes work on Vercel.

// Time correction: machine clock is 1h ahead of Google servers
const _origDateNow = Date.now;
(Date as any).now = () => _origDateNow() - 3600 * 1000;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

let startupError: any = null;
let authRoutes: any = null;
let serviceRoutes: any = null;
let adminRoutes: any = null;

try {
  // Firebase is automatically initialized via server/src/config/firebase.ts on import
  // We use dynamic imports to catch any top-level execution errors in these files
  authRoutes = (await import('../server/src/routes/auth.js')).default;
  serviceRoutes = (await import('../server/src/routes/services.js')).default;
  adminRoutes = (await import('../server/src/routes/admin.js')).default;
} catch (e: any) {
  startupError = e;
  console.error("CRITICAL STARTUP ERROR:", e);
}

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

if (authRoutes) app.use('/api/auth', authRoutes);
if (serviceRoutes) app.use('/api/services', serviceRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  if (startupError) {
    res.status(500).json({ status: 'error', error: startupError.toString(), stack: startupError.stack });
  } else {
    res.json({ status: 'ok', database: 'firebase' });
  }
});

export default app;
