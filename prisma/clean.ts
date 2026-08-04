import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Cleaning database (removing all fake/sample data)...');

  // Delete in reverse foreign-key order
  await prisma.auditLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.meal.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.canteen.deleteMany({});
  await prisma.college.deleteMany({});
  await prisma.setting.deleteMany({});

  console.log('✨ Database is now completely clean and empty!');
  console.log('You can now add your own real data via your app or Supabase Dashboard.');
}

cleanDatabase()
  .catch((e) => {
    console.error('❌ Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
