import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../constants';
import { AuthService, OrderService, MealService, CanteenService, CashfreePaymentService, CollegeService, CategoryService, AdminService, CartService } from '../services';

const authService = new AuthService();
const orderService = new OrderService();
const mealService = new MealService();
const canteenService = new CanteenService();
const collegeService = new CollegeService();
const categoryService = new CategoryService();
const adminService = new AdminService();
const cashfreeService = new CashfreePaymentService();
const cartService = new CartService();

// ─── Auth Controller ──────────────────────────────────────────────────────────
export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password, role } = req.body;
      const result = await authService.login(email, password, role);
      return sendSuccess(res, 'Login successful', result);
    } catch (err: any) {
      return sendError(res, err.message || 'Login failed', [], 401);
    }
  }

  static async registerStudent(req: Request, res: Response) {
    try {
      const result = await authService.registerStudent(req.body);
      return sendSuccess(res, 'Student registered successfully', result, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Registration failed', [], 400);
    }
  }
}

// ─── College Controller ───────────────────────────────────────────────────────
export class CollegeController {
  static async getAll(req: Request, res: Response) {
    try {
      const colleges = await collegeService.getAllColleges();
      return sendSuccess(res, 'Colleges retrieved', colleges);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch colleges', [], 500);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const college = await collegeService.createCollege(req.body);
      return sendSuccess(res, 'College created successfully', college, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create college', [], 400);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const college = await collegeService.updateCollege(id, req.body);
      return sendSuccess(res, 'College updated successfully', college);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update college', [], 400);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await collegeService.deleteCollege(id);
      return sendSuccess(res, 'College deleted successfully', { id });
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete college', [], 400);
    }
  }
}

// ─── Category Controller ──────────────────────────────────────────────────────
export class CategoryController {
  static async getByCanteen(req: Request, res: Response) {
    try {
      const canteenId = req.params.canteenId as string;
      const categories = await categoryService.getCategoriesByCanteen(canteenId);
      return sendSuccess(res, 'Categories retrieved', categories);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch categories', [], 500);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const category = await categoryService.createCategory(req.body);
      return sendSuccess(res, 'Category created successfully', category, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create category', [], 400);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const category = await categoryService.updateCategory(id, req.body);
      return sendSuccess(res, 'Category updated successfully', category);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update category', [], 400);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await categoryService.deleteCategory(id);
      return sendSuccess(res, 'Category deleted successfully', { id });
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete category', [], 400);
    }
  }
}

// ─── Order Controller ─────────────────────────────────────────────────────────
export class OrderController {
  static async placeOrder(req: Request, res: Response) {
    try {
      const result = await orderService.placeOrder(req.body);
      return sendSuccess(res, 'Order created successfully', result, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create order', [], 400);
    }
  }

  static async getOrder(req: Request, res: Response) {
    try {
      const orderId = req.params.orderId as string;
      const result = await orderService.getOrderDetails(orderId);
      return sendSuccess(res, 'Order details retrieved', result);
    } catch (err: any) {
      return sendError(res, err.message || 'Order not found', [], 404);
    }
  }
}

// ─── Meal Controller ──────────────────────────────────────────────────────────
export class MealController {
  static async getMenu(req: Request, res: Response) {
    try {
      const canteenId = req.query.canteen_id as string;
      if (!canteenId) {
        return sendSuccess(res, 'Canteen menu retrieved', []);
      }
      const menu = await mealService.getCanteenMenu(canteenId);
      return sendSuccess(res, 'Canteen menu retrieved', menu);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch menu', [], 500);
    }
  }

  static async getAllMeals(req: Request, res: Response) {
    try {
      const meals = await mealService.getAllMeals();
      return sendSuccess(res, 'All meals retrieved', meals);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch meals', [], 500);
    }
  }

  static async createMeal(req: Request, res: Response) {
    try {
      const meal = await mealService.createMeal(req.body);
      return sendSuccess(res, 'Meal created successfully', meal, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create meal', [], 400);
    }
  }

  static async updateMeal(req: Request, res: Response) {
    try {
      const mealId = req.params.mealId as string;
      const meal = await mealService.updateMeal(mealId, req.body);
      return sendSuccess(res, 'Meal updated successfully', meal);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update meal', [], 400);
    }
  }

  static async deleteMeal(req: Request, res: Response) {
    try {
      const mealId = req.params.mealId as string;
      await mealService.deleteMeal(mealId);
      return sendSuccess(res, 'Meal deleted successfully', { id: mealId });
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete meal', [], 400);
    }
  }
}

// ─── Canteen Controller ───────────────────────────────────────────────────────
export class CanteenController {
  static async getAll(req: Request, res: Response) {
    try {
      const canteens = await canteenService.getAllCanteens();
      return sendSuccess(res, 'Canteens retrieved', canteens);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch canteens', [], 500);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const canteenId = req.params.canteenId as string;
      const canteen = await canteenService.getCanteenById(canteenId);
      return sendSuccess(res, 'Canteen details retrieved', canteen);
    } catch (err: any) {
      return sendError(res, err.message || 'Canteen not found', [], 404);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const canteen = await canteenService.createCanteen(req.body);
      return sendSuccess(res, 'Canteen created successfully', canteen, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create canteen', [], 400);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const canteenId = req.params.canteenId as string;
      const canteen = await canteenService.updateCanteen(canteenId, req.body);
      return sendSuccess(res, 'Canteen updated successfully', canteen);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update canteen', [], 400);
    }
  }

  static async setupProfile(req: Request, res: Response) {
    try {
      const canteenId = req.params.canteenId as string;
      const canteen = await canteenService.setupCanteenProfile(canteenId, req.body);
      return sendSuccess(res, 'Canteen setup completed successfully', canteen);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to save canteen setup', [], 400);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const canteenId = req.params.canteenId as string;
      await canteenService.deleteCanteen(canteenId);
      return sendSuccess(res, 'Canteen deleted successfully', { id: canteenId });
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete canteen', [], 400);
    }
  }

  static async getOrders(req: Request, res: Response) {
    try {
      const canteenId = req.params.canteenId as string;
      const orders = await orderService.getOrdersByCanteen(canteenId);
      return sendSuccess(res, 'Canteen orders retrieved', orders);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch orders', [], 500);
    }
  }
}

// ─── Admin Controller ─────────────────────────────────────────────────────────
export class AdminController {
  static async createCanteenOwner(req: Request, res: Response) {
    try {
      const owner = await adminService.createCanteenOwner(req.body);
      return sendSuccess(res, 'Canteen owner account created successfully', owner, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create owner account', [], 400);
    }
  }

  static async getAllStudents(req: Request, res: Response) {
    try {
      const students = await adminService.getAllStudents();
      return sendSuccess(res, 'Students list retrieved', students);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch students', [], 500);
    }
  }
}

// ─── Payment Controller ───────────────────────────────────────────────────────
export class PaymentController {
  static async createCashfreeOrder(req: Request, res: Response) {
    try {
      const { order_id, amount, student_email, student_phone } = req.body;
      const paymentSession = await cashfreeService.createPaymentOrder(
        order_id,
        amount,
        student_email || 'student@campus.edu',
        student_phone || '9876543210'
      );
      return sendSuccess(res, 'Cashfree payment session initiated', paymentSession);
    } catch (err: any) {
      return sendError(res, err.message || 'Payment initiation failed', [], 500);
    }
  }

  static async handleWebhook(req: Request, res: Response) {
    return sendSuccess(res, 'Webhook processed successfully', { received: true });
  }
}

// ─── Cart Controller ──────────────────────────────────────────────────────────
export class CartController {
  static async getCart(req: Request, res: Response) {
    try {
      const studentId = req.params.studentId as string;
      const cart = await cartService.getStudentCart(studentId);
      return sendSuccess(res, 'Cart retrieved successfully', cart);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch cart', [], 400);
    }
  }

  static async addItem(req: Request, res: Response) {
    try {
      const { student_id, food_id, quantity } = req.body;
      const item = await cartService.addItemToCart(student_id, food_id, quantity || 1);
      return sendSuccess(res, 'Item added to cart', item, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to add item to cart', [], 400);
    }
  }

  static async updateQty(req: Request, res: Response) {
    try {
      const cartItemId = req.params.cartItemId as string;
      const { quantity } = req.body;
      const result = await cartService.updateItemQty(cartItemId, quantity);
      return sendSuccess(res, 'Cart item updated', result);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update cart item', [], 400);
    }
  }

  static async clear(req: Request, res: Response) {
    try {
      const studentId = req.params.studentId as string;
      const result = await cartService.clearCart(studentId);
      return sendSuccess(res, 'Cart cleared successfully', result);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to clear cart', [], 400);
    }
  }
}

