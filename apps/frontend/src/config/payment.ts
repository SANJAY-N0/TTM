export const PAYMENT_CONFIG = {
  mode: process.env.VITE_CASHFREE_MODE || 'sandbox',
  appId: process.env.VITE_CASHFREE_APP_ID || '',
  currency: 'INR',
};
