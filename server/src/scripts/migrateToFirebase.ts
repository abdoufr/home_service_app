import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

dotenv.config();

// Initialize Firebase Admin (using local service account for migration)
// Make sure to have your serviceAccountKey.json in the root or set ENV vars
if (!admin.apps.length) {
  try {
    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('Private Key length:', process.env.FIREBASE_PRIVATE_KEY?.length);

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error("Missing Firebase credentials in environment variables");
    }

    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    // Handle quotes if they were included in the variable value
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    // Convert literal \n strings to actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    console.log('Private Key starts with:', privateKey.substring(0, 30));
    console.log('Private Key ends with:', privateKey.substring(privateKey.length - 30));
    console.log('Has newlines:', privateKey.includes('\n'));

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      } as admin.ServiceAccount),
    });
  } catch (e: any) {
    console.error("❌ Error initializing Firebase Admin:", e.message);
    process.exit(1);
  }
}

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });
const db = admin.firestore();

async function migrate() {
  console.log('🚀 Starting migration to Firebase...');

  // 1. Categories
  console.log('--- Migrating Categories ---');
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    await db.collection('categories').doc(cat.id).set({
      name: cat.name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 2. Users
  console.log('--- Migrating Users ---');
  const users = await prisma.user.findMany();
  for (const user of users) {
    await db.collection('users').doc(user.id).set({
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      approved: user.approved,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Note: Passwords are NOT migrated to Firebase Auth here as they are Bcrypt hashed.
    // You should use Firebase Auth Import for that if needed.
  }

  // 3. Services
  console.log('--- Migrating Services ---');
  const services = await prisma.service.findMany();
  for (const srv of services) {
    await db.collection('services').doc(srv.id).set({
      title: srv.title,
      description: srv.description,
      price: srv.price,
      workerId: srv.workerId,
      categoryId: srv.categoryId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 4. Orders
  console.log('--- Migrating Orders ---');
  const orders = await prisma.order.findMany();
  for (const ord of orders) {
    await db.collection('orders').doc(ord.id).set({
      clientId: ord.clientId,
      serviceId: ord.serviceId,
      status: ord.status,
      scheduledAt: ord.scheduledAt ? admin.firestore.Timestamp.fromDate(ord.scheduledAt) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 5. Messages
  console.log('--- Migrating Messages ---');
  const messages = await prisma.message.findMany();
  for (const msg of messages) {
    await db.collection('messages').doc(msg.id).set({
      orderId: msg.orderId,
      senderId: msg.senderId,
      content: msg.content,
      isRead: msg.isRead,
      createdAt: admin.firestore.Timestamp.fromDate(msg.createdAt),
    });
  }

  // 6. Notifications
  console.log('--- Migrating Notifications ---');
  const notifs = await prisma.notification.findMany();
  for (const n of notifs) {
    await db.collection('notifications').doc(n.id).set({
      userId: n.userId,
      type: n.type,
      content: n.content,
      linkId: n.linkId,
      isRead: n.isRead,
      createdAt: admin.firestore.Timestamp.fromDate(n.createdAt),
    });
  }

  console.log('✅ Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
