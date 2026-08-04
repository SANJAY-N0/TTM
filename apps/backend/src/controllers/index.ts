import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../constants';
import { AuthService, OrderService, MealService, CanteenService, CashfreePaymentService } from '../services';

const authService = new AuthService();
const orderService = new OrderService();
const mealService = new MealService();
const canteenService = new CanteenService();
const cashfreeService = new CashfreePaymentService();

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
      const { orderId } = req.params;
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
      const canteenId = (req.query.canteen_id as string) || 'default-canteen';
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
      const { mealId } = req.params;
      const meal = await mealService.updateMeal(mealId, req.body);
      return sendSuccess(res, 'Meal updated successfully', meal);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update meal', [], 400);
    }
  }

  static async deleteMeal(req: Request, res: Response) {
    try {
      const { mealId } = req.params;
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
      const { canteenId } = req.params;
      const canteen = await canteenService.getCanteenById(canteenId);
      return sendSuccess(res, 'Canteen details retrieved', canteen);
    } catch (err: any) {
      return sendError(res, err.message || 'Canteen not found', [], 404);
    }
  }

  static async getOrders(req: Request, res: Response) {
    try {
      const { canteenId } = req.params;
      const orders = await orderService.getOrdersByCanteen(canteenId);
      return sendSuccess(res, 'Canteen orders retrieved', orders);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch orders', [], 500);
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
