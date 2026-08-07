import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRepository, OrderRepository, FoodItemRepository, CanteenRepository, CollegeRepository, CategoryRepository, CartRepository } from '../repositories';

const userRepo = new UserRepository();
const orderRepo = new OrderRepository();
const foodItemRepo = new FoodItemRepository();
const canteenRepo = new CanteenRepository();
const collegeRepo = new CollegeRepository();
const categoryRepo = new CategoryRepository();
const cartRepo = new CartRepository();

export class AuthService {
  async login(email: string, password: string, role: string = 'STUDENT') {
    const user = await userRepo.findByEmail(email);

    // Verify password against the bcrypt hash stored in the database
    const passwordMatches = await userRepo.verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, canteen_id: user.canteen_id, college_id: user.college_id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, canteen_id: user.canteen_id, college_id: user.college_id } };
  }

  async registerStudent(data: any) {
    const newUser = await userRepo.create(data);
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: 'STUDENT', college_id: newUser.college_id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );
    return { token, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, college_id: newUser.college_id } };
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

  async getOrdersByStudent(studentId: string) {
    return await orderRepo.getOrdersByStudent(studentId);
  }

  async updateOrderStatus(orderId: string, status: string) {
    return await orderRepo.updateOrderStatus(orderId, status);
  }
}

export class MealService {
  async getCanteenMenu(canteenId: string) {
    return await foodItemRepo.getByCanteen(canteenId);
  }

  async getAllMeals() {
    return await foodItemRepo.getAll();
  }

  async createMeal(data: any) {
    return await foodItemRepo.create(data);
  }

  async updateMeal(id: string, data: any) {
    return await foodItemRepo.update(id, data);
  }

  async deleteMeal(id: string) {
    return await foodItemRepo.delete(id);
  }
}

export class CollegeService {
  async getAllColleges() {
    return await collegeRepo.getAll();
  }

  async createCollege(data: any) {
    return await collegeRepo.create(data);
  }

  async updateCollege(id: string, data: any) {
    return await collegeRepo.update(id, data);
  }

  async deleteCollege(id: string) {
    return await collegeRepo.delete(id);
  }
}

export class CategoryService {
  async getCategoriesByCanteen(canteenId: string) {
    return await categoryRepo.getByCanteen(canteenId);
  }

  async createCategory(data: any) {
    return await categoryRepo.create(data);
  }

  async updateCategory(id: string, data: any) {
    return await categoryRepo.update(id, data);
  }

  async deleteCategory(id: string) {
    return await categoryRepo.delete(id);
  }
}

export class CanteenService {
  async getAllCanteens() {
    return await canteenRepo.getAll();
  }

  async getCanteensByCollege(collegeId: string) {
    return await canteenRepo.getByCollege(collegeId);
  }

  async getCanteenById(id: string) {
    return await canteenRepo.findById(id);
  }

  async createCanteen(data: any) {
    return await canteenRepo.create(data);
  }

  async updateCanteen(id: string, data: any) {
    return await canteenRepo.update(id, data);
  }

  async setupCanteenProfile(canteenId: string, payload: any) {
    return await canteenRepo.setupCanteenProfile(canteenId, payload);
  }

  async deleteCanteen(id: string) {
    return await canteenRepo.delete(id);
  }
}

export class AdminService {
  async createCanteenOwner(data: { email: string; password?: string; name: string; phone?: string; college_id: string; canteen_id: string; }) {
    return await userRepo.createCanteenOwner(data);
  }

  async getAllStudents() {
    return await userRepo.getAllStudents();
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

export class CartService {
  async getStudentCart(studentId: string) {
    return await cartRepo.getCartByStudent(studentId);
  }

  async addItemToCart(studentId: string, foodId: string, quantity: number) {
    return await cartRepo.addItemToCart(studentId, foodId, quantity);
  }

  async updateItemQty(cartItemId: string, quantity: number) {
    return await cartRepo.updateItemQty(cartItemId, quantity);
  }

  async clearCart(studentId: string) {
    return await cartRepo.clearCart(studentId);
  }
}

