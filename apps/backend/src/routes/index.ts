import { Router } from 'express';
import { 
  AuthController, OrderController, MealController, PaymentController, 
  CanteenController, CollegeController, CategoryController, AdminController, 
  CartController, DepartmentController, AcademicYearController, 
  CanteenAccountController, StudentController, AuditLogController, UploadController 
} from '../controllers';
import { validateRequest, authenticateJwt, authorizeRoles } from '../middlewares/auth.middleware';
import { 
  LoginSchema, GoogleAuthSchema, RegisterStudentSchema, CreateOrderSchema, 
  CreateCanteenSchema, CreateCanteenAccountSchema, CreateCollegeSchema, 
  CreateDepartmentSchema, CreateAcademicYearSchema 
} from '../validation/schemas';
import { sendSuccess } from '../constants';

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
// Multi-portal authentication
apiRouter.post('/api/v1/auth/login', validateRequest(LoginSchema), AuthController.login);
apiRouter.post('/api/auth/login', validateRequest(LoginSchema), AuthController.login);

apiRouter.post('/api/v1/auth/google', validateRequest(GoogleAuthSchema), AuthController.googleAuth);
apiRouter.post('/api/auth/google', validateRequest(GoogleAuthSchema), AuthController.googleAuth);

apiRouter.post('/api/v1/auth/register-student', validateRequest(RegisterStudentSchema), AuthController.registerStudent);
apiRouter.post('/api/auth/register-student', validateRequest(RegisterStudentSchema), AuthController.registerStudent);

apiRouter.get('/api/v1/auth/me', authenticateJwt, AuthController.me);
apiRouter.get('/api/auth/me', authenticateJwt, AuthController.me);

// ─── Image Upload (Cloudinary) ────────────────────────────────────────────────
apiRouter.post('/api/v1/upload', UploadController.uploadImage);
apiRouter.post('/api/upload', UploadController.uploadImage);

// ─── College Routes ───────────────────────────────────────────────────────────
apiRouter.get('/api/v1/colleges', CollegeController.getAll);
apiRouter.get('/api/colleges', CollegeController.getAll);
apiRouter.post('/api/v1/colleges', validateRequest(CreateCollegeSchema), CollegeController.create);
apiRouter.put('/api/v1/colleges/:id', CollegeController.update);
apiRouter.delete('/api/v1/colleges/:id', CollegeController.delete);
apiRouter.get('/api/v1/colleges/:collegeId/departments', CollegeController.getDepartments);
apiRouter.get('/api/v1/colleges/:collegeId/academic-years', CollegeController.getAcademicYears);

// ─── Department Routes ───────────────────────────────────────────────────────
apiRouter.get('/api/v1/departments', DepartmentController.getAll);
apiRouter.post('/api/v1/departments', validateRequest(CreateDepartmentSchema), DepartmentController.create);
apiRouter.put('/api/v1/departments/:id', DepartmentController.update);
apiRouter.delete('/api/v1/departments/:id', DepartmentController.delete);

// ─── Academic Year Routes ────────────────────────────────────────────────────
apiRouter.get('/api/v1/academic-years', AcademicYearController.getAll);
apiRouter.post('/api/v1/academic-years', validateRequest(CreateAcademicYearSchema), AcademicYearController.create);
apiRouter.put('/api/v1/academic-years/:id', AcademicYearController.update);
apiRouter.delete('/api/v1/academic-years/:id', AcademicYearController.delete);

// ─── Canteen Routes ───────────────────────────────────────────────────────────
apiRouter.get('/api/v1/canteens', CanteenController.getAll);
apiRouter.get('/api/canteens', CanteenController.getAll);
apiRouter.get('/api/v1/canteens/:canteenId', CanteenController.getById);
apiRouter.post('/api/v1/canteens', validateRequest(CreateCanteenSchema), CanteenController.create);
apiRouter.put('/api/v1/canteens/:canteenId', CanteenController.update);
apiRouter.post('/api/v1/canteens/:canteenId/setup', CanteenController.setupProfile);
apiRouter.delete('/api/v1/canteens/:canteenId', CanteenController.delete);
apiRouter.get('/api/v1/canteens/:canteenId/orders', CanteenController.getOrders);

// ─── Canteen Account Routes (Admin Managed) ──────────────────────────────────
apiRouter.get('/api/v1/admin/canteen-accounts', CanteenAccountController.getAll);
apiRouter.post('/api/v1/admin/canteen-accounts', validateRequest(CreateCanteenAccountSchema), CanteenAccountController.create);
apiRouter.put('/api/v1/admin/canteen-accounts/:id/status', CanteenAccountController.updateStatus);

// ─── Student Management Routes (Admin Managed) ───────────────────────────────
apiRouter.get('/api/v1/admin/students', StudentController.getAll);
apiRouter.put('/api/v1/admin/students/:id/status', StudentController.updateStatus);

// ─── Audit Log Routes ────────────────────────────────────────────────────────
apiRouter.get('/api/v1/admin/audit-logs', AuditLogController.getLogs);

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

// ─── Cart Routes ──────────────────────────────────────────────────────────────
apiRouter.get('/api/v1/cart/:studentId', CartController.getCart);
apiRouter.post('/api/v1/cart/items', CartController.addItem);
apiRouter.put('/api/v1/cart/items/:cartItemId', CartController.updateQty);
apiRouter.delete('/api/v1/cart/:studentId', CartController.clear);

// ─── Order Routes ─────────────────────────────────────────────────────────────
apiRouter.post('/api/v1/orders', validateRequest(CreateOrderSchema), OrderController.placeOrder);
apiRouter.get('/api/v1/orders/:orderId', OrderController.getOrder);

// ─── Payment Gateway Routes (Cashfree) ───────────────────────────────────────
apiRouter.post('/api/v1/payment/cashfree/create', PaymentController.createCashfreeOrder);
apiRouter.post('/api/v1/payment/cashfree/webhook', PaymentController.handleWebhook);

// ─── Admin Management Routes ──────────────────────────────────────────────────
apiRouter.post('/api/v1/admin/canteen-owners', AdminController.createCanteenOwner);
apiRouter.get('/api/v1/admin/dashboard', AdminController.getDashboard);

export default apiRouter;
