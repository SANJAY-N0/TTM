import { Router } from 'express';
import { AuthController, OrderController, MealController, PaymentController, CanteenController, CollegeController, CategoryController, AdminController, CartController } from '../controllers';
import { validateRequest } from '../middlewares/auth.middleware';
import { LoginSchema, RegisterStudentSchema, CreateOrderSchema } from '../validation/schemas';
import { sendSuccess } from '../constants';

import { supabase } from '../repositories';

const apiRouter = Router();

// ─── Health Check ────────────────────────────────────────────────────────────
apiRouter.get('/health', (req, res) => {
  return sendSuccess(res, 'Campus Canteen SaaS System Healthy', {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: 'v3.6.04'
  });
});

// ─── Authentication Routes ────────────────────────────────────────────────────
apiRouter.post('/api/v1/auth/login', validateRequest(LoginSchema), AuthController.login);
apiRouter.post('/api/v1/auth/register-student', validateRequest(RegisterStudentSchema), AuthController.registerStudent);

// ─── Cart Routes ──────────────────────────────────────────────────────────────
apiRouter.get('/api/v1/cart/:studentId', CartController.getCart);
apiRouter.post('/api/v1/cart/items', CartController.addItem);
apiRouter.put('/api/v1/cart/items/:cartItemId', CartController.updateQty);
apiRouter.delete('/api/v1/cart/:studentId', CartController.clear);

// ─── College Routes ───────────────────────────────────────────────────────────
apiRouter.get('/api/v1/colleges', CollegeController.getAll);
apiRouter.post('/api/v1/colleges', CollegeController.create);
apiRouter.put('/api/v1/colleges/:id', CollegeController.update);
apiRouter.delete('/api/v1/colleges/:id', CollegeController.delete);

// ─── Canteen Routes ───────────────────────────────────────────────────────────
apiRouter.get('/api/v1/canteens', CanteenController.getAll);
apiRouter.get('/api/v1/canteens/:canteenId', CanteenController.getById);
apiRouter.post('/api/v1/canteens', CanteenController.create);
apiRouter.put('/api/v1/canteens/:canteenId', CanteenController.update);
apiRouter.post('/api/v1/canteens/:canteenId/setup', CanteenController.setupProfile);
apiRouter.delete('/api/v1/canteens/:canteenId', CanteenController.delete);
apiRouter.get('/api/v1/canteens/:canteenId/orders', CanteenController.getOrders);

// ─── Food Category Routes ─────────────────────────────────────────────────────
apiRouter.get('/api/v1/canteens/:canteenId/categories', CategoryController.getByCanteen);
apiRouter.post('/api/v1/categories', CategoryController.create);
apiRouter.put('/api/v1/categories/:id', CategoryController.update);
apiRouter.delete('/api/v1/categories/:id', CategoryController.delete);

// ─── Meals Routes ─────────────────────────────────────────────────────────────
apiRouter.get('/api/v1/meals', MealController.getMenu);
apiRouter.get('/api/v1/meals/all', MealController.getAllMeals);
apiRouter.post('/api/v1/meals', MealController.createMeal);
apiRouter.put('/api/v1/meals/:mealId', MealController.updateMeal);
apiRouter.delete('/api/v1/meals/:mealId', MealController.deleteMeal);

// ─── Order Routes ─────────────────────────────────────────────────────────────
apiRouter.post('/api/v1/orders', validateRequest(CreateOrderSchema), OrderController.placeOrder);
apiRouter.get('/api/v1/orders/:orderId', OrderController.getOrder);

// ─── Payment Gateway Routes (Cashfree) ───────────────────────────────────────
apiRouter.post('/api/v1/payment/cashfree/create', PaymentController.createCashfreeOrder);
apiRouter.post('/api/v1/payment/cashfree/webhook', PaymentController.handleWebhook);

// ─── Admin Management Routes ──────────────────────────────────────────────────
apiRouter.post('/api/v1/admin/canteen-owners', AdminController.createCanteenOwner);
apiRouter.get('/api/v1/admin/students', AdminController.getAllStudents);

apiRouter.get('/api/v1/admin/dashboard', async (req, res) => {
  try {
    const [{ count: collegesCount }, { count: studentsCount }, { count: canteenCount }, { data: recentOrders }] = await Promise.all([
      supabase.from('colleges').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT'),
      supabase.from('canteens').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('orders').select('*, order_items(*)').limit(10)
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
});

export default apiRouter;

