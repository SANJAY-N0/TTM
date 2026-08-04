# REST API Specifications - Campus Canteen SaaS

Base URL: `/api/v1`

Standard Response Formats:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

---

## 1. System Health
- **`GET /health`** - System status, uptime, and version.

## 2. Authentication (`/api/v1/auth`)
- **`POST /api/v1/auth/login`**: Authenticate Student, Canteen Staff, or Super Admin.
- **`POST /api/v1/auth/register-student`**: Register new student account.

## 3. Meals (`/api/v1/meals`)
- **`GET /api/v1/meals?canteen_id={id}`**: Retrieve active canteen menu items.

## 4. Orders (`/api/v1/orders`)
- **`POST /api/v1/orders`**: Create a new meal order.
- **`GET /api/v1/orders/:orderId`**: Fetch details and token for a specific order.

## 5. Payments (`/api/v1/payment`)
- **`POST /api/v1/payment/cashfree/create`**: Generate Cashfree payment order & session.
- **`POST /api/v1/payment/cashfree/webhook`**: Handle Cashfree webhook verification.

## 6. Super Admin (`/api/v1/admin`)
- **`GET /api/v1/admin/dashboard`**: Fetch institution metrics (Requires JWT + SUPER_ADMIN role).
