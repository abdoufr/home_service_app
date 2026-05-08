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
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin Initialized via serviceAccountKey.json');
  } catch (error) {
    console.log('ℹ️ serviceAccountKey.json not found, using ENV variables');
    try {
      let pk = process.env.FIREBASE_PRIVATE_KEY || '';
      if ((pk.startsWith('"') && pk.endsWith('"')) || (pk.startsWith("'") && pk.endsWith("'"))) {
        pk = pk.substring(1, pk.length - 1);
      }
      pk = pk.replace(/\\n/g, '\n');

      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: pk,
      };
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    } catch (e: any) {
      console.error('❌ Firebase Admin Initialization Error:', e);
      firebaseInitError = e.message;
    }
  }
}

export const db = admin.apps.length ? admin.firestore() : null as any;
export const auth = admin.apps.length ? admin.auth() : null as any;

if (!db) {
  console.error("❌ Critical: Firestore not initialized. Check your environment variables.");
}
