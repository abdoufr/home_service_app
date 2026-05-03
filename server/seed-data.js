const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcrypt');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = [
    { name: 'Client Test', email: 'client@test.com', password: 'password', role: 'CLIENT' },
    { name: 'Worker Test', email: 'worker@test.com', password: 'password', role: 'WORKER' }
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    try {
      await prisma.user.upsert({
        where: { email: u.email },
        update: { approved: true },
        create: {
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: u.role,
          approved: true
        }
      });
      console.log(`✅ User ${u.role} created: ${u.email}`);
    } catch (e) {
      console.error(`❌ Error creating ${u.role}:`, e);
    }
  }

  // Categories
  const categories = ['Plomberie', 'Électricité', 'Nettoyage', 'Peinture'];
  for (const name of categories) {
    try {
      await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name }
      });
      console.log(`✅ Category created: ${name}`);
    } catch (e) {}
  }

  await prisma.$disconnect();
}

main();
