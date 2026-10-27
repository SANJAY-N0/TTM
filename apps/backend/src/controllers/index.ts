import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../constants';
import { 
  AuthService, OrderService, MealService, CanteenService, 
  CashfreePaymentService, CollegeService, CategoryService, AdminService, 
  CartService, DepartmentService, AcademicYearService, CanteenAccountService,
  StudentService, AuditLogService 
} from '../services';
import { CloudinaryService } from '../services/CloudinaryService';
import { supabase } from '../repositories';

const authService = new AuthService();
const orderService = new OrderService();
const mealService = new MealService();
const canteenService = new CanteenService();
const collegeService = new CollegeService();
const categoryService = new CategoryService();
const adminService = new AdminService();
const cashfreeService = new CashfreePaymentService();
const cartService = new CartService();
const deptService = new DepartmentService();
const ayService = new AcademicYearService();
const canteenAccService = new CanteenAccountService();
const studentService = new StudentService();
const auditLogService = new AuditLogService();

// ─── Auth Controller ──────────────────────────────────────────────────────────
export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const identifier = req.body.email || req.body.username || req.body.identifier;
      const { password, role } = req.body;
      if (!identifier || !password) {
        return sendError(res, 'Email/Username and Password are required', [], 400);
      }
      const result = await authService.login(identifier, password, role);
      return sendSuccess(res, 'Login successful', result);
    } catch (err: any) {
      return sendError(res, err.message || 'Login failed', [], 401);
    }
  }

  static async googleAuth(req: Request, res: Response) {
    try {
      const { email, name, picture, googleId } = req.body;
      if (!email) {
        return sendError(res, 'Google email address is required', [], 400);
      }
      const result = await authService.authenticateGoogle({ email, name, picture, googleId });
      return sendSuccess(res, 'Google authentication successful', result);
    } catch (err: any) {
      return sendError(res, err.message || 'Google authentication failed', [], 400);
    }
  }

  static async registerStudent(req: Request, res: Response) {
    try {
      const result = await authService.registerStudentProfile(req.body);
      return sendSuccess(res, 'Student profile setup successful', result, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Registration failed', [], 400);
    }
  }

  static async me(req: any, res: Response) {
    try {
      const user = await authService.getCurrentUser(req.user);
      return sendSuccess(res, 'Current user retrieved', user);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to retrieve user', [], 401);
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

  static async getDepartments(req: Request, res: Response) {
    try {
      const collegeId = req.params.collegeId as string;
      const depts = await deptService.getByCollege(collegeId);
      return sendSuccess(res, 'Departments retrieved', depts);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch departments', [], 400);
    }
  }

  static async getAcademicYears(req: Request, res: Response) {
    try {
      const collegeId = req.params.collegeId as string;
      const years = await ayService.getByCollege(collegeId);
      return sendSuccess(res, 'Academic years retrieved', years);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch academic years', [], 400);
    }
  }
}

// ─── Department Controller ───────────────────────────────────────────────────
export class DepartmentController {
  static async getAll(req: Request, res: Response) {
    try {
      const depts = await deptService.getAll();
      return sendSuccess(res, 'All departments retrieved', depts);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch departments', [], 500);
    }
  }

  static async getByCollege(req: Request, res: Response) {
    try {
      const collegeId = req.params.collegeId as string;
      const depts = await deptService.getByCollege(collegeId);
      return sendSuccess(res, 'College departments retrieved', depts);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch departments', [], 400);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const dept = await deptService.create(req.body);
      return sendSuccess(res, 'Department created successfully', dept, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create department', [], 400);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const dept = await deptService.update(id, req.body);
      return sendSuccess(res, 'Department updated successfully', dept);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update department', [], 400);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await deptService.delete(id);
      return sendSuccess(res, 'Department deleted successfully', { id });
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete department', [], 400);
    }
  }
}

// ─── Academic Year Controller ────────────────────────────────────────────────
export class AcademicYearController {
  static async getAll(req: Request, res: Response) {
    try {
      const years = await ayService.getAll();
      return sendSuccess(res, 'Academic years retrieved', years);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch academic years', [], 500);
    }
  }

  static async getByCollege(req: Request, res: Response) {
    try {
      const collegeId = req.params.collegeId as string;
      const years = await ayService.getByCollege(collegeId);
      return sendSuccess(res, 'College academic years retrieved', years);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch academic years', [], 400);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const year = await ayService.create(req.body);
      return sendSuccess(res, 'Academic year created successfully', year, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create academic year', [], 400);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const year = await ayService.update(id, req.body);
      return sendSuccess(res, 'Academic year updated successfully', year);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update academic year', [], 400);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await ayService.delete(id);
      return sendSuccess(res, 'Academic year deleted successfully', { id });
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete academic year', [], 400);
    }
  }
}

// ─── Canteen Account Controller ──────────────────────────────────────────────
export class CanteenAccountController {
  static async getAll(req: Request, res: Response) {
    try {
      const accounts = await canteenAccService.getAll();
      return sendSuccess(res, 'Canteen accounts retrieved', accounts);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch canteen accounts', [], 500);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const account = await canteenAccService.create(req.body);
      return sendSuccess(res, 'Canteen account provisioned successfully', account, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create canteen account', [], 400);
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const result = await canteenAccService.updateStatus(id, status);
      return sendSuccess(res, 'Canteen account status updated', result);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update status', [], 400);
    }
  }
}

// ─── Student Controller ──────────────────────────────────────────────────────
export class StudentController {
  static async getAll(req: Request, res: Response) {
    try {
      const collegeId = req.query.collegeId as string;
      const students = await studentService.getAll(collegeId);
      return sendSuccess(res, 'Students retrieved successfully', students);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch students', [], 500);
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const result = await studentService.updateStatus(id, status);
      return sendSuccess(res, 'Student status updated', result);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update student status', [], 400);
    }
  }
}

// ─── Audit Log Controller ────────────────────────────────────────────────────
export class AuditLogController {
  static async getLogs(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await auditLogService.getRecent(limit);
      return sendSuccess(res, 'Audit logs retrieved', logs);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch audit logs', [], 500);
    }
  }
}

// ─── Upload Controller ───────────────────────────────────────────────────────
export class UploadController {
  static async uploadImage(req: Request, res: Response) {
    try {
      const { image, folder } = req.body;
      if (!image) {
        return sendError(res, 'Image data URI is required', [], 400);
      }
      const cloudinary = CloudinaryService.getInstance();
      const result = await cloudinary.uploadImage(image, folder || 'canteens');
      return sendSuccess(res, 'Image uploaded successfully', {
        url: result.secure_url || result.url,
        public_id: result.public_id
      }, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Image upload failed', [], 400);
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

// ─── Canteen Controller ───────────────────────────────────────────────────────
export class CanteenController {
  static async getAll(req: Request, res: Response) {
    try {
      const canteens = await canteenService.getAllCanteens();
      return sendSuccess(res, 'Canteens retrieved successfully', canteens);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch canteens', [], 500);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const canteenId = req.params.canteenId as string;
      const canteen = await canteenService.getCanteenById(canteenId);
      if (!canteen) {
        return sendError(res, 'Canteen not found', [], 404);
      }
      return sendSuccess(res, 'Canteen retrieved successfully', canteen);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch canteen', [], 500);
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
      return sendSuccess(res, 'Canteen profile updated successfully', canteen);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to setup canteen profile', [], 400);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const canteenId = req.params.canteenId as string;
      await canteenService.deleteCanteen(canteenId);
      return sendSuccess(res, 'Canteen deleted successfully', { canteenId });
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete canteen', [], 400);
    }
  }

  static async getOrders(req: Request, res: Response) {
    try {
      const canteenId = req.params.canteenId as string;
      const orders = await orderService.getOrdersByCanteen(canteenId);
      return sendSuccess(res, 'Canteen orders retrieved successfully', orders);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch canteen orders', [], 500);
    }
  }
}

// ─── Meal Controller ──────────────────────────────────────────────────────────
export class MealController {
  static async getMenu(req: Request, res: Response) {
    try {
      const canteenId = (req.query.canteenId as string) || (req.query.canteen_id as string);
      if (!canteenId) {
        return sendError(res, 'Canteen ID is required', [], 400);
      }
      const menu = await mealService.getCanteenMenu(canteenId);
      return sendSuccess(res, 'Menu retrieved successfully', menu);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch menu', [], 500);
    }
  }

  static async getAllMeals(req: Request, res: Response) {
    try {
      const meals = await mealService.getAllMeals();
      return sendSuccess(res, 'All meals retrieved successfully', meals);
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
      return sendSuccess(res, 'Meal deleted successfully', { mealId });
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete meal', [], 400);
    }
  }
}

// ─── Order Controller ─────────────────────────────────────────────────────────
export class OrderController {
  static async placeOrder(req: Request, res: Response) {
    try {
      const newOrder = await orderService.placeOrder(req.body);
      return sendSuccess(res, 'Order placed successfully', newOrder, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to place order', [], 400);
    }
  }

  static async getOrder(req: Request, res: Response) {
    try {
      const orderId = req.params.orderId as string;
      const order = await orderService.getOrderDetails(orderId);
      if (!order) {
        return sendError(res, 'Order not found', [], 404);
      }
      return sendSuccess(res, 'Order details retrieved', order);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to retrieve order', [], 500);
    }
  }
}

// ─── Payment Controller ───────────────────────────────────────────────────────
export class PaymentController {
  static async createCashfreeOrder(req: Request, res: Response) {
    try {
      const { order_id, amount, student_email, student_phone } = req.body;
      const paymentOrder = await cashfreeService.createPaymentOrder(order_id, amount, student_email, student_phone);
      return sendSuccess(res, 'Payment session initialized', paymentOrder);
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

// ─── Admin Controller ─────────────────────────────────────────────────────────
export class AdminController {
  static async createCanteenOwner(req: Request, res: Response) {
    try {
      const owner = await adminService.createCanteenOwner(req.body);
      return sendSuccess(res, 'Canteen owner created successfully', owner, 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create canteen owner', [], 400);
    }
  }

  static async getAllStudents(req: Request, res: Response) {
    try {
      const students = await studentService.getAll();
      return sendSuccess(res, 'Students retrieved successfully', students);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch students', [], 500);
    }
  }

  static async getDashboard(req: Request, res: Response) {
    try {
      const [{ count: collegesCount }, { count: studentsCount }, { count: canteenCount }, { data: recentOrders }] = await Promise.all([
        supabase.from('colleges').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('canteens').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(10)
      ]);

      return sendSuccess(res, 'Super Admin Dashboard Access Granted', {
        collegesCount: collegesCount || 0,
        studentsCount: studentsCount || 0,
        canteenCount: canteenCount || 0,
        totalRevenue: 0,
        recentOrders: recentOrders || []
      });
    } catch (err) {
      console.error('Admin dashboard DB error:', err);
      return sendSuccess(res, 'Super Admin Dashboard', {
        collegesCount: 0, studentsCount: 0, canteenCount: 0, totalRevenue: 0, recentOrders: []
      });
    }
  }
}
