import admin from 'firebase-admin';

import path from 'path';

// FIX: Shift time by -1 hour to match Google's UTC servers (avoids invalid_grant)
const originalDateNow = Date.now;
Date.now = () => originalDateNow() - 3600 * 1000;

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
    });
    console.log('✅ Firebase Admin Initialized via serviceAccountKey.json');
  } catch (error) {
    console.log('ℹ️ serviceAccountKey.json not found, using ENV variables');
    try {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
