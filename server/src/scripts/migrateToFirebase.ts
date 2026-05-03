import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

dotenv.config();

// Initialize Firebase Admin using serviceAccountKey.json (most reliable method)
if (!admin.apps.length) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require('../../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin Initialized via serviceAccountKey.json');
  } catch (e: any) {
    console.error('❌ Could not load serviceAccountKey.json:', e.message);
    console.error('👉 Make sure serviceAccountKey.json is in the /server/ directory');
    process.exit(1);
  }
}

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });
const db = admin.firestore();

async function migrate() {
  console.log('🚀 Starting migration SQLite → Firebase Firestore...\n');

  // 1. Categories
  console.log('📁 [1/6] Migrating Categories...');
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    await db.collection('categories').doc(cat.id).set({
      id: cat.id,
      name: cat.name,
      createdAt: cat.createdAt.toISOString(),
    });
  }
  console.log(`   ✅ ${categories.length} categories migrated`);

  // 2. Users
  console.log('👤 [2/6] Migrating Users...');
  const users = await prisma.user.findMany();
  for (const user of users) {
    await db.collection('users').doc(user.id).set({
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      phone: user.phone ?? null,
      role: user.role,
      approved: user.approved,
      createdAt: user.createdAt.toISOString(),
    });
  }
  console.log(`   ✅ ${users.length} users migrated`);

  // 3. Services
  console.log('🔧 [3/6] Migrating Services...');
  const services = await prisma.service.findMany();
  for (const srv of services) {
    await db.collection('services').doc(srv.id).set({
      id: srv.id,
      title: srv.title,
      description: srv.description,
      price: srv.price,
      workerId: srv.workerId,
      categoryId: srv.categoryId,
      createdAt: srv.createdAt.toISOString(),
    });
  }
  console.log(`   ✅ ${services.length} services migrated`);

  // 4. Orders
  console.log('📋 [4/6] Migrating Orders...');
  const orders = await prisma.order.findMany();
  for (const ord of orders) {
    await db.collection('orders').doc(ord.id).set({
      id: ord.id,
      clientId: ord.clientId,
      serviceId: ord.serviceId,
      status: ord.status,
      scheduledAt: ord.scheduledAt ? ord.scheduledAt.toISOString() : null,
      createdAt: ord.createdAt.toISOString(),
    });
  }
  console.log(`   ✅ ${orders.length} orders migrated`);

  // 5. Messages
  console.log('💬 [5/6] Migrating Messages...');
  const messages = await prisma.message.findMany();
  for (const msg of messages) {
    await db.collection('messages').doc(msg.id).set({
      id: msg.id,
      orderId: msg.orderId,
      senderId: msg.senderId,
      content: msg.content,
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
    });
  }
  console.log(`   ✅ ${messages.length} messages migrated`);

  // 6. Notifications
  console.log('🔔 [6/6] Migrating Notifications...');
  const notifs = await prisma.notification.findMany();
  for (const n of notifs) {
    await db.collection('notifications').doc(n.id).set({
      id: n.id,
      userId: n.userId,
      type: n.type,
      content: n.content,
      linkId: n.linkId ?? null,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    });
  }
  console.log(`   ✅ ${notifs.length} notifications migrated`);

  // 7. Settings
  console.log('⚙️  [+] Migrating Settings...');
  const settings = await prisma.settings.findFirst();
  if (settings) {
    await db.collection('settings').doc('global').set({
      autoApproveUsers: settings.autoApproveUsers,
      autoApproveWorkers: settings.autoApproveWorkers,
    });
    console.log(`   ✅ Settings migrated`);
  }

  console.log('\n🎉 Migration complete! All data is now in Firebase Firestore.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
