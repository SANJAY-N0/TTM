export const API_ENDPOINTS = {
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_LOGOUT: '/api/v1/auth/logout',
  CANTEEN_ORDERS: (id: string) => `/api/v1/canteens/${id}/orders`,
  PAYMENTS_CREATE: '/api/payments/create-order',
  PAYMENTS_STREAM: '/api/payments/stream',
};
