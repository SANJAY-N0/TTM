import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRepository, OrderRepository, MealRepository, CanteenRepository } from '../repositories';

const userRepo = new UserRepository();
const orderRepo = new OrderRepository();
const mealRepo = new MealRepository();
const canteenRepo = new CanteenRepository();

export class AuthService {
  async login(email: string, password: string, role: string = 'STUDENT') {
    const user = await userRepo.findByEmail(email);

    // Verify password against the bcrypt hash stored in the database
    const passwordMatches = await userRepo.verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }

  async registerStudent(data: any) {
    const newUser = await userRepo.create(data);
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: 'STUDENT' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    return { token, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } };
  }
}

export class OrderService {
  async placeOrder(orderPayload: any) {
    const newOrder = await orderRepo.createOrder(orderPayload);
    return newOrder;
  }

  async getOrderDetails(orderId: string) {
    return await orderRepo.findById(orderId);
  }

  async getOrdersByCanteen(canteenId: string) {
    return await orderRepo.getOrdersByCanteen(canteenId);
  }
}

export class MealService {
  async getCanteenMenu(canteenId: string) {
    return await mealRepo.getMealsByCanteen(canteenId);
  }

  async getAllMeals() {
    return await mealRepo.getAllMeals();
  }

  async createMeal(data: any) {
    return await mealRepo.createMeal(data);
  }

  async updateMeal(id: string, data: any) {
    return await mealRepo.updateMeal(id, data);
  }

  async deleteMeal(id: string) {
    return await mealRepo.deleteMeal(id);
  }
}

export class CanteenService {
  async getAllCanteens() {
    return await canteenRepo.getAll();
  }

  async getCanteenById(id: string) {
    return await canteenRepo.findById(id);
  }
}

export class CashfreePaymentService {
  async createPaymentOrder(orderId: string, amount: number, studentEmail: string, studentPhone: string) {
    const cashfreeOrderId = `CF_ORD_${Date.now()}`;
    return {
      cashfree_order_id: cashfreeOrderId,
      payment_session_id: `session_${cashfreeOrderId}`,
      payment_url: `https://sandbox.cashfree.com/pg/orders/${cashfreeOrderId}`,
      amount,
      environment: config.cashfreeEnv
    };
  }

  async verifyWebhookSignature(rawBody: string, signature: string, timestamp: string) {
    return true;
  }
}
