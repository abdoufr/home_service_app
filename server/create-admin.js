const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcrypt');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@admin.com';
  const password = 'admin';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if admin settings exist, if not create them
  const settings = await prisma.settings.findFirst();
  if (!settings) {
    await prisma.settings.create({
      data: { autoApproveUsers: true, autoApproveWorkers: true }
    });
  }

  // Create admin user
  try {
    const admin = await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword, role: 'ADMIN', approved: true },
      create: {
        email,
        password: hashedPassword,
        name: 'Administrator',
        role: 'ADMIN',
        approved: true
      }
    });
    console.log('✅ Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (e) {
    console.error('❌ Error creating admin:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
