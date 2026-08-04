import { Router } from 'express';
import { AuthController, OrderController, MealController, PaymentController, CanteenController } from '../controllers';
import { authenticateJwt, authorizeRoles, validateRequest } from '../middlewares/auth.middleware';
import { LoginSchema, RegisterStudentSchema, CreateOrderSchema, CreateMealSchema } from '../validation/schemas';
import { UserRole, sendSuccess } from '../constants';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const apiRouter = Router();

// ─── Health Check ────────────────────────────────────────────────────────────
apiRouter.get('/health', (req, res) => {
  return sendSuccess(res, 'Campus Canteen SaaS System Healthy', {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: 'v1.0.0-MVP'
  });
});

// ─── Authentication Routes ────────────────────────────────────────────────────
apiRouter.post('/api/v1/auth/login', validateRequest(LoginSchema), AuthController.login);
apiRouter.post('/api/v1/auth/register-student', validateRequest(RegisterStudentSchema), AuthController.registerStudent);

// ─── Meals Routes (DB-connected) ─────────────────────────────────────────────
// Get meals for a specific canteen or all meals
apiRouter.get('/api/v1/meals', MealController.getMenu);
apiRouter.get('/api/v1/meals/all', MealController.getAllMeals);

// Create / Update / Delete meal (canteen staff)
apiRouter.post('/api/v1/meals', MealController.createMeal);
apiRouter.put('/api/v1/meals/:mealId', MealController.updateMeal);
apiRouter.delete('/api/v1/meals/:mealId', MealController.deleteMeal);

// ─── Canteen Routes (DB-connected) ───────────────────────────────────────────
apiRouter.get('/api/v1/canteens', CanteenController.getAll);
apiRouter.get('/api/v1/canteens/:canteenId', CanteenController.getById);
apiRouter.get('/api/v1/canteens/:canteenId/orders', CanteenController.getOrders);

// ─── Order Routes (DB-connected) ─────────────────────────────────────────────
apiRouter.post('/api/v1/orders', validateRequest(CreateOrderSchema), OrderController.placeOrder);
apiRouter.get('/api/v1/orders/:orderId', OrderController.getOrder);

// ─── Payment Gateway Routes (Cashfree) ───────────────────────────────────────
apiRouter.post('/api/v1/payment/cashfree/create', PaymentController.createCashfreeOrder);
apiRouter.post('/api/v1/payment/cashfree/webhook', PaymentController.handleWebhook);

// ─── Admin Dashboard (Protected, DB-connected) ───────────────────────────────
apiRouter.get('/api/v1/admin/dashboard', authenticateJwt, authorizeRoles(UserRole.SUPER_ADMIN), async (req, res) => {
  try {
    const [collegesCount, studentsCount, canteenCount, totalRevenueAggregate, recentOrders] = await Promise.all([
      prisma.college.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.canteen.count(),
      prisma.order.aggregate({
        _sum: { paid_amount: true },
        where: { payment_status: 'SUCCESS' }
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { student: { select: { name: true, email: true } } }
      })
    ]);

    return sendSuccess(res, 'Super Admin Dashboard Access Granted', {
      collegesCount,
      studentsCount,
      canteenCount,
      totalRevenue: totalRevenueAggregate._sum.paid_amount || 0,
      recentOrders
    });
  } catch (err) {
    console.error('Admin dashboard DB error:', err);
    return sendSuccess(res, 'Super Admin Dashboard', {
      collegesCount: 0, studentsCount: 0, canteenCount: 0, totalRevenue: 0, recentOrders: []
    });
  }
});

export default apiRouter;
