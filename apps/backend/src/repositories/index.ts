// Repository Layer: All methods use PrismaClient to query the real Supabase database.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// USER REPOSITORY
// ─────────────────────────────────────────────
export class UserRepository {
  async findByEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`User not found for email: ${email}`);
    return user;
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error(`User not found: ${id}`);
    return user;
  }

  async create(data: any) {
    const password_hash = await bcrypt.hash(data.password || 'Password@123', 10);
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password_hash,
        name: data.name || data.full_name || 'New Student',
        phone: data.phone || null,
        roll_number: data.roll_number || null,
        role: 'STUDENT',
        college_id: data.college_id || null,
      }
    });
    return newUser;
  }

  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}

// ─────────────────────────────────────────────
// ORDER REPOSITORY
// ─────────────────────────────────────────────
export class OrderRepository {
  async createOrder(orderData: any) {
    const orderCode = `TTM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = await prisma.order.create({
      data: {
        order_code: orderCode,
        student_id: orderData.student_id,
        canteen_id: orderData.canteen_id || 'canteen-main-001',
        total_amount: Number(orderData.total_amount || 0),
        paid_amount: Number(orderData.paid_amount || 0),
        payment_method: orderData.payment_method || 'UPI_QR',
        payment_status: orderData.payment_status || 'PENDING',
        order_status: 'PENDING',
      },
      include: { order_items: true }
    });
    return newOrder;
  }

  async findById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { order_items: { include: { meal: true } }, student: true }
    });
    if (!order) throw new Error(`Order not found: ${orderId}`);
    return order;
  }

  async getOrdersByCanteen(canteenId: string) {
    return prisma.order.findMany({
      where: { canteen_id: canteenId },
      include: { order_items: true, student: { select: { id: true, name: true, email: true } } },
      orderBy: { created_at: 'desc' },
      take: 50
    });
  }

  async getOrdersByStudent(studentId: string) {
    return prisma.order.findMany({
      where: { student_id: studentId },
      include: { order_items: { include: { meal: true } } },
      orderBy: { created_at: 'desc' }
    });
  }
}

// ─────────────────────────────────────────────
// MEAL REPOSITORY
// ─────────────────────────────────────────────
export class MealRepository {
  async getMealsByCanteen(canteenId: string) {
    // If "default-canteen" is requested, use the first available canteen
    let targetCanteenId = canteenId;
    if (!canteenId || canteenId === 'default-canteen') {
      const firstCanteen = await prisma.canteen.findFirst({ where: { status: 'ACTIVE' } });
      targetCanteenId = firstCanteen?.id || canteenId;
    }

    const meals = await prisma.meal.findMany({
      where: {
        canteen_id: targetCanteenId,
        status: 'ACTIVE',
        is_available: true
      },
      orderBy: { category: 'asc' }
    });

    return meals;
  }

  async getAllMeals() {
    return prisma.meal.findMany({
      where: { status: 'ACTIVE' },
      include: { canteen: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' }
    });
  }

  async createMeal(data: any) {
    return prisma.meal.create({ data });
  }

  async updateMeal(id: string, data: any) {
    return prisma.meal.update({ where: { id }, data });
  }

  async deleteMeal(id: string) {
    return prisma.meal.update({ where: { id }, data: { status: 'DELETED', is_available: false } });
  }
}

// ─────────────────────────────────────────────
// CANTEEN REPOSITORY
// ─────────────────────────────────────────────
export class CanteenRepository {
  async getAll() {
    return prisma.canteen.findMany({
      where: { status: 'ACTIVE' },
      include: { college: true }
    });
  }

  async findById(id: string) {
    return prisma.canteen.findUnique({
      where: { id },
      include: { college: true, meals: { where: { status: 'ACTIVE' } } }
    });
  }
}
