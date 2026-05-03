import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// FIX: Shift time by -1 hour to match Google's UTC servers (avoids invalid_grant)
const originalDateNow = Date.now;
Date.now = () => originalDateNow() - 3600 * 1000;

dotenv.config();

// Initialize Firebase Admin using serviceAccountKey.json
if (!admin.apps.length) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require('../../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin Initialized');
  } catch (e: any) {
    console.error('❌ Could not initialize Firebase:', e.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function seed() {
  console.log('🌱 Seeding Firebase Firestore...\n');

  // 1. Settings
  console.log('⚙️  Creating Settings...');
  await db.collection('settings').doc('global').set({
    autoApproveUsers: true,
    autoApproveWorkers: false,
  });
  console.log('   ✅ Settings created');

  // 2. Categories
  console.log('\n📁 Creating Categories...');
  const categories = [
    'Plomberie',
    'Électricité',
    'Peinture',
    'Jardinage',
    'Nettoyage',
    'Menuiserie',
    'Climatisation',
    'Déménagement',
  ];
  const categoryIds: Record<string, string> = {};
  for (const name of categories) {
    const ref = db.collection('categories').doc();
    await ref.set({ id: ref.id, name, createdAt: new Date().toISOString() });
    categoryIds[name] = ref.id;
  }
  console.log(`   ✅ ${categories.length} categories created`);

  // 3. Admin User
  console.log('\n👤 Creating Admin User...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminRef = db.collection('users').doc();
  await adminRef.set({
    id: adminRef.id,
    email: 'admin@homeserv.dz',
    password: hashedPassword,
    name: 'Administrateur',
    phone: null,
    role: 'ADMIN',
    approved: true,
    createdAt: new Date().toISOString(),
  });
  console.log('   ✅ Admin created: admin@homeserv.dz / admin123');

  console.log('\n🎉 Seed complete! Firebase Firestore is ready.\n');
  console.log('📋 Summary:');
  console.log(`   - Settings: initialized`);
  console.log(`   - Categories: ${categories.length} created`);
  console.log(`   - Admin: admin@homeserv.dz (password: admin123)`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
