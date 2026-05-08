import admin from 'firebase-admin';

import path from 'path';

import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let firebaseInitError: string | null = null;

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin Initialized via serviceAccountKey.json');
    } else {
      throw new Error('Key file not found');
    }
  } catch (error) {
    console.log('ℹ️ serviceAccountKey.json not found or invalid, using ENV variables');
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let pk = process.env.FIREBASE_PRIVATE_KEY || '';

      if (!projectId || !clientEmail || !pk) {
        throw new Error('Missing Firebase environment variables (PROJECT_ID, CLIENT_EMAIL, or PRIVATE_KEY)');
      }

      // Handle quotes and escaped newlines
      if (pk.startsWith('"') && pk.endsWith('"')) pk = pk.slice(1, -1);
      if (pk.startsWith("'") && pk.endsWith("'")) pk = pk.slice(1, -1);
      pk = pk.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: pk,
        }),
      });
      console.log('✅ Firebase Admin Initialized via ENV variables');
    } catch (e: any) {
      console.error('❌ Firebase Admin Initialization Error:', e.message);
      firebaseInitError = e.message;
    }
  }
}

export const db = admin.apps.length ? admin.firestore() : null;
export const auth = admin.apps.length ? admin.auth() : null;

if (!db) {
  console.error("⚠️ Warning: Firestore is NOT initialized. Database calls will fail.");
}
