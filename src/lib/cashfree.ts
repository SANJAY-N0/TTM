import { EnvironmentService } from '../services/EnvironmentService';

export const getCashfreeConfig = () => {
  const envService = EnvironmentService.getInstance();
  const isProd = envService.isProduction();
  
  const appId = process.env.CASHFREE_APP_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || '';
  const env = isProd ? 'PRODUCTION' : 'SANDBOX';
  
  const baseUrl = isProd
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
    
  return {
    appId: appId.replace(/^["']|["']$/g, '').trim(),
    secretKey: secretKey.replace(/^["']|["']$/g, '').trim(),
    env,
    baseUrl
  };
};
