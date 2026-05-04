// This is the Vercel Serverless Function entry point.
// It wraps the entire Express app so all /api/* routes work on Vercel.

// Time correction: machine clock is 1h ahead of Google servers
const _origDateNow = Date.now;
(Date as any).now = () => _origDateNow() - 3600 * 1000;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize Firebase before importing routes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic firebase-admin import with serviceAccountKey.json fallback
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const keyPath = path.join(__dirname, '../server/serviceAccountKey.json');
    admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
  } catch {
    // Production: use env vars
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as any),
    });
  }
}

import authRoutes from '../server/src/routes/auth.js';
import serviceRoutes from '../server/src/routes/services.js';
import adminRoutes from '../server/src/routes/admin.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'firebase' });
});

export default app;
