import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create a College
  const college = await prisma.college.upsert({
    where: { code: 'CIT001' },
    update: {},
    create: {
      name: 'Campus Institute of Technology',
      code: 'CIT001',
      address: 'Knowledge Park II',
      city: 'Greater Noida',
      state: 'Uttar Pradesh',
      contact_person: 'Dean Admin',
      email: 'admin@cit.edu',
      phone: '+91 9876543210',
    },
  });
  console.log('✅ College created:', college.name);

  // 2. Create a Canteen
  const canteen = await prisma.canteen.upsert({
    where: { id: 'canteen-main-001' },
    update: {},
    create: {
      id: 'canteen-main-001',
      name: 'Central Campus Canteen',
      location: 'Block-A Ground Floor',
      contact_phone: '+91 9123456789',
      is_online: true,
      college_id: college.id,
    },
  });
  console.log('✅ Canteen created:', canteen.name);

  // 3. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@timetomeal.com' },
    update: {},
    create: {
      name: 'Canteen Admin Manager',
      email: 'admin@timetomeal.com',
      password_hash: hashedPassword,
      role: 'CANTEEN',
      college_id: college.id,
      canteen_id: canteen.id,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Student User
  const student = await prisma.user.upsert({
    where: { email: 'student@cit.edu' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'student@cit.edu',
      roll_number: '2026-CS-042',
      password_hash: hashedPassword,
      role: 'STUDENT',
      college_id: college.id,
    },
  });
  console.log('✅ Student user created:', student.email);

  // 4. Create Meal Items
  const meals = [
    {
      item_name: 'Special Veg Thali',
      category: 'Meals',
      price: 120,
      discount_price: 100,
      is_veg: true,
      stock_online: 50,
      prep_time_mins: 15,
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
    },
    {
      item_name: 'Paneer Butter Masala Roll',
      category: 'Snacks',
      price: 80,
      discount_price: 70,
      is_veg: true,
      stock_online: 80,
      prep_time_mins: 10,
      image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500',
    },
    {
      item_name: 'Cold Coffee with Ice Cream',
      category: 'Beverages',
      price: 60,
      discount_price: 50,
      is_veg: true,
      stock_online: 100,
      prep_time_mins: 5,
      image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500',
    },
  ];

  for (const meal of meals) {
    await prisma.meal.create({
      data: {
        ...meal,
        canteen_id: canteen.id,
      },
    });
  }
  console.log(`✅ ${meals.length} Meal items created!`);

  console.log('🚀 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
