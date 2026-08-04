declare global {
  interface Window {
    Cashfree?: any;
  }
}

export interface CashfreeInitConfig {
  mode?: 'sandbox' | 'production';
}

/**
 * Initializes the Cashfree SDK instance on the client.
 * Uses window.Cashfree or window.Cashfree.init({ mode: 'sandbox' }) if available.
 */
export const initCashfree = (config: CashfreeInitConfig = { mode: 'sandbox' }) => {
  if (typeof window === 'undefined') return null;

  if (window.Cashfree) {
    if (typeof window.Cashfree.init === 'function') {
      return window.Cashfree.init({ mode: config.mode || 'sandbox' });
    }
    return window.Cashfree({ mode: config.mode || 'sandbox' });
  }
  return null;
};

/**
 * Loads the Cashfree JS SDK script from CDN if not present on page
 */
export const loadCashfreeSDK = (): Promise<any> => {
  if (typeof window === 'undefined') return Promise.reject('Window is undefined');

  if (window.Cashfree) {
    return Promise.resolve(initCashfree({ mode: 'sandbox' }));
  }

  return new Promise((resolve, reject) => {
    const scriptId = 'cashfree-js-sdk-v3';
    if (document.getElementById(scriptId)) {
      if (window.Cashfree) resolve(initCashfree({ mode: 'sandbox' }));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      const instance = initCashfree({ mode: 'sandbox' });
      resolve(instance);
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree JS SDK'));
    document.body.appendChild(script);
  });
};

/**
 * Creates a payment order session via backend API using appId and secretKey from server environment (.env).
 */
export const createPaymentSession = async (params: {
  amount: number;
  studentId?: string;
  studentName?: string;
  phone?: string;
  canteenId?: string;
  items?: any[];
  orderType?: string;
  paymentMethod?: string;
}) => {
  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create payment session');
  }

  return await response.json();
};

/**
 * Triggers Cashfree checkout modal using window.Cashfree SDK instance in sandbox mode.
 */
export const triggerCheckout = async (paymentSessionId: string, redirectTarget: '_modal' | '_self' = '_modal') => {
  const cashfree = await loadCashfreeSDK();
  if (!cashfree) {
    throw new Error('Cashfree SDK not initialized');
  }

  return cashfree.checkout({
    paymentSessionId,
    redirectTarget
  });
};
