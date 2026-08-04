import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createStudent() {
  const email = process.argv[2] || 'student@example.com';
  const name = process.argv[3] || 'Simple Student';
  const password = process.argv[4] || 'student123';
  const rollNumber = process.argv[5] || '2026-STU-001';

  console.log(`Creating student account for: ${email}...`);

  const password_hash = await bcrypt.hash(password, 10);

  const student = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password_hash,
      roll_number: rollNumber,
    },
    create: {
      email,
      name,
      password_hash,
      roll_number: rollNumber,
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Student Account Saved Successfully in Supabase Database!');
  console.log('----------------------------------------------------');
  console.log(`Student ID  : ${student.id}`);
  console.log(`Email       : ${student.email}`);
  console.log(`Password    : ${password}`);
  console.log(`Roll Number : ${student.roll_number}`);
  console.log('----------------------------------------------------');
}

createStudent()
  .catch((err) => {
    console.error('❌ Error creating student:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
