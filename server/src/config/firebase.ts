import admin from 'firebase-admin';

import path from 'path';

import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FIX: Shift time by -1 hour to match Google's UTC servers (avoids invalid_grant)
const originalDateNow = Date.now;
Date.now = () => originalDateNow() - 3600 * 1000;

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
    } catch (e) {
      console.error('❌ Firebase Admin Initialization Error:', e);
    }
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
