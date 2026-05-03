/**
 * Reset script — clears all data except the admin user
 * Run with: npx ts-node src/reset.ts
 */
import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Resetting database...');

  // Delete in correct order (respect foreign keys)
  await prisma.order.deleteMany({});
  console.log('✅ Orders cleared');

  await prisma.service.deleteMany({});
  console.log('✅ Services cleared');

  await prisma.category.deleteMany({});
  console.log('✅ Categories cleared');

  await prisma.settings.deleteMany({});
  console.log('✅ Settings cleared');

  // Delete all users EXCEPT admin
  await prisma.user.deleteMany({
    where: { role: { not: 'ADMIN' } }
  });
  console.log('✅ All non-admin users cleared');

  // Re-create categories
  const categories = [
    'Nettoyage', 'Plomberie', 'Électricité', 'Jardinage',
    'Peinture', 'Serrurerie', 'Déménagement', 'Climatisation'
  ];
  for (const name of categories) {
    await prisma.category.create({ data: { name } });
  }
  console.log('✅ Categories restored');

  // Re-create settings
  await prisma.settings.create({
    data: { autoApproveUsers: true, autoApproveWorkers: false }
  });
  console.log('✅ Settings restored');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  console.log('\n🎉 Reset complete! Admin account preserved:');
  console.log(`   Email: ${admin?.email}`);
}

main()
  .catch((e) => { console.error('❌ Reset failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
