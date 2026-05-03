import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Admin Settings
  await prisma.settings.create({
    data: {
      autoApproveUsers: true,
      autoApproveWorkers: false,
    },
  });

  // 2. Create Default Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@homeserv.dz',
      password: adminPassword,
      name: 'Admin System',
      role: 'ADMIN',
      approved: true,
    },
  });

  // 3. Create Some Categories
  const categories = ['Plomberie', 'Électricité', 'Nettoyage', 'Peinture', 'Jardinage'];
  for (const name of categories) {
    await prisma.category.create({
      data: { name },
    });
  }

  console.log('Seeding completed! 🚀');
  console.log('Admin: admin@homeserv.dz / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
