import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
  console.log('🔍 Checking Supabase database connection...');

  try {
    // Perform a raw query test (ping database)
    const result = await prisma.$queryRaw`SELECT 1 as connected, NOW() as current_time;`;
    
    // Count records in core tables
    const userCount = await prisma.user.count();
    const collegeCount = await prisma.college.count();
    const canteenCount = await prisma.canteen.count();
    const mealCount = await prisma.meal.count();
    const orderCount = await prisma.order.count();

    console.log('🟢 SUCCESS: Database is CONNECTED!');
    console.log('----------------------------------------------------');
    console.log('Database Time :', (result as any)[0]?.current_time);
    console.log('Total Users   :', userCount);
    console.log('Total Colleges:', collegeCount);
    console.log('Total Canteens:', canteenCount);
    console.log('Total Meals   :', mealCount);
    console.log('Total Orders  :', orderCount);
    console.log('----------------------------------------------------');
  } catch (error: any) {
    console.error('🔴 ERROR: Database is NOT connected!');
    console.error('Details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseConnection();
