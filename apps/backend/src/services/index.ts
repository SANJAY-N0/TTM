import jwt from 'jsonwebtoken';
import { config } from '../config';
import { 
  UserRepository, OrderRepository, FoodItemRepository, CanteenRepository, 
  CollegeRepository, CategoryRepository, CartRepository, DepartmentRepository,
  AcademicYearRepository, CanteenAccountRepository, AuditLogRepository, StudentRepository
} from '../repositories';

const userRepo = new UserRepository();
const orderRepo = new OrderRepository();
const foodItemRepo = new FoodItemRepository();
const canteenRepo = new CanteenRepository();
const collegeRepo = new CollegeRepository();
const categoryRepo = new CategoryRepository();
const cartRepo = new CartRepository();
const deptRepo = new DepartmentRepository();
const ayRepo = new AcademicYearRepository();
const canteenAccRepo = new CanteenAccountRepository();
const auditLogRepo = new AuditLogRepository();
const studentRepo = new StudentRepository();

export class AuthService {
  async login(identifier: string, password: string, requestedRole?: string) {
    const user = await userRepo.findByUsernameOrEmail(identifier);

    // Verify password against the bcrypt hash stored in the database
    const passwordMatches = await userRepo.verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    // Role-Based Access Control verification
    if (requestedRole) {
      const normalizedRequested = requestedRole.toUpperCase();
      const userRole = (user.role || '').toUpperCase();

      if (normalizedRequested === 'CANTEEN' || normalizedRequested === 'CANTEEN_OWNER') {
        if (userRole !== 'CANTEEN_OWNER' && userRole !== 'CANTEEN' && userRole !== 'CANTEEN_ADMIN') {
          throw new Error('Access denied. This account does not have Canteen Owner permissions.');
        }
      } else if (normalizedRequested === 'ADMIN' || normalizedRequested === 'SUPER_ADMIN') {
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'COLLEGE_ADMIN') {
          throw new Error('Access denied. Administrator privileges are required to log in here.');
        }
      } else if (normalizedRequested === 'STUDENT') {
        if (userRole !== 'STUDENT') {
          throw new Error('Access denied. This portal is for students only.');
        }
      }
    }

    if (user.status && user.status.toLowerCase() !== 'active') {
      throw new Error(`This account has been ${user.status}. Please contact TimeToMeal support.`);
    }

    // Standardize role in token
    let role = user.role;
    if (role === 'SUPER_ADMIN' || role === 'COLLEGE_ADMIN') role = 'ADMIN';
    if (role === 'CANTEEN_ADMIN' || role === 'CANTEEN_STAFF') role = 'CANTEEN_OWNER';

    const token = jwt.sign(
      { 
        id: user.id || user.user_id, 
        email: user.email, 
        role, 
        canteen_id: user.canteen_id, 
        college_id: user.college_id 
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return { 
      token, 
      user: { 
        id: user.id || user.user_id, 
        email: user.email, 
        name: user.name || user.full_name, 
        role, 
        canteen_id: user.canteen_id, 
        college_id: user.college_id,
        status: user.status,
        must_change_password: user.must_change_password || false
      } 
    };
  }

  async authenticateGoogle(payload: { email: string; name?: string; picture?: string; googleId?: string }) {
    const { student, detectedCollege, isProfileComplete } = await userRepo.authenticateGoogleStudent(
      payload.email,
      payload.name,
      payload.picture,
      payload.googleId
    );

    const token = jwt.sign(
      {
        id: student?.student_id || payload.email,
        email: payload.email,
        role: 'STUDENT',
        college_id: detectedCollege.id
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      token,
      isProfileComplete,
      detectedCollege,
      user: {
        id: student?.student_id || payload.email,
        email: payload.email,
        name: student?.full_name || payload.name || 'Student',
        role: 'STUDENT',
        college_id: detectedCollege.id,
        student_id: student?.student_id,
        roll_number: student?.roll_number,
        department_id: student?.department_id,
        stay_classification: student?.stay_classification || 'HOSTELLER'
      }
    };
  }

  async registerStudentProfile(data: any) {
    const studentUser = await userRepo.registerStudentProfile(data);
    const token = jwt.sign(
      {
        id: studentUser.student_id,
        email: studentUser.email,
        role: 'STUDENT',
        college_id: studentUser.college_id
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      token,
      user: studentUser,
      message: 'Student profile verified and saved successfully!'
    };
  }

  async getCurrentUser(authPayload: any) {
    try {
      const user = await userRepo.findByUsernameOrEmail(authPayload.email || authPayload.id);
      return {
        id: user.id || user.user_id,
        email: user.email,
        name: user.name || user.full_name,
        role: user.role,
        canteen_id: user.canteen_id,
        college_id: user.college_id
      };
    } catch {
      return {
        id: authPayload.id,
        email: authPayload.email,
        name: authPayload.name || 'Authenticated User',
        role: authPayload.role,
        canteen_id: authPayload.canteen_id,
        college_id: authPayload.college_id
      };
    }
  }
}

export class DepartmentService {
  async getAll() {
    return await deptRepo.getAll();
  }

  async getByCollege(collegeId: string) {
    return await deptRepo.getByCollege(collegeId);
  }

  async create(data: any) {
    return await deptRepo.create(data);
  }

  async update(id: string, data: any) {
    return await deptRepo.update(id, data);
  }

  async delete(id: string) {
    return await deptRepo.delete(id);
  }
}

export class AcademicYearService {
  async getAll() {
    return await ayRepo.getAll();
  }

  async getByCollege(collegeId: string) {
    return await ayRepo.getByCollege(collegeId);
  }

  async create(data: any) {
    return await ayRepo.create(data);
  }

  async update(id: string, data: any) {
    return await ayRepo.update(id, data);
  }

  async delete(id: string) {
    return await ayRepo.delete(id);
  }
}

export class CanteenAccountService {
  async getAll() {
    return await canteenAccRepo.getAll();
  }

  async create(data: any) {
    return await canteenAccRepo.create(data);
  }

  async updateStatus(id: string, status: string) {
    return await canteenAccRepo.updateStatus(id, status);
  }
}

export class StudentService {
  async getAll(collegeId?: string) {
    return await studentRepo.getAll(collegeId);
  }

  async updateStatus(id: string, status: string) {
    return await studentRepo.updateStatus(id, status);
  }
}

export class AuditLogService {
  async log(action: string, entityType: string, entityId?: string, details?: any, userId?: string) {
    return await auditLogRepo.log(action, entityType, entityId, details, userId);
  }

  async getRecent(limit?: number) {
    return await auditLogRepo.getRecent(limit);
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
    return await studentRepo.getAll();
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
