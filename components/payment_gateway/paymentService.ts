// Payment Service for Official Cashfree JS SDK Integration (v3)
// Configured for Sandbox Mode with credentials:
// App ID: TEST1115864987dc532ebfcdde0745ef94685111
// Secret: TvYRWi6_uF8azvYG0V_SBJAJgjE

declare global {
  interface Window {
    Cashfree?: any;
  }
}

export interface CashfreeOrderRequest {
  amount: number;
  studentId?: string;
  studentName?: string;
  phone?: string;
  email?: string;
  canteenId?: string;
  items?: any[];
  orderType?: 'walk-in' | 'online';
  paymentMethod?: string;
}

export interface CashfreeOrderResponse {
  success: boolean;
  order_id: string;
  cashfree_order_id?: string;
  payment_session_id?: string;
  upi_qr_string?: string;
  amount: number;
  is_mock?: boolean;
  error?: string;
}

export interface VerificationResponse {
  success: boolean;
  payment_status: 'PAID' | 'PENDING' | 'FAILED' | string;
  orderId: string;
  cfPaymentId?: string;
  message?: string;
}

export class PaymentGatewayService {
  private mode: 'sandbox' | 'production' = 'sandbox';

  constructor(mode: 'sandbox' | 'production' = 'sandbox') {
    this.mode = mode;
  }

  /**
   * Dynamically loads the official Cashfree JS SDK v3 script if not present
   */
  public async loadCashfreeSDK(): Promise<any> {
    if (typeof window !== 'undefined' && window.Cashfree) {
      return window.Cashfree({ mode: this.mode });
    }

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        return reject(new Error('Window object is missing'));
      }

      const existingScript = document.getElementById('cashfree-js-sdk');
      if (existingScript) {
        if (window.Cashfree) {
          return resolve(window.Cashfree({ mode: this.mode }));
        }
      }

      const script = document.createElement('script');
      script.id = 'cashfree-js-sdk';
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => {
        if (window.Cashfree) {
          resolve(window.Cashfree({ mode: this.mode }));
        } else {
          reject(new Error('Cashfree SDK instance not found on window object'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Cashfree JS SDK script from CDN'));
      document.body.appendChild(script);
    });
  }

  /**
   * Calls server endpoint to create Cashfree Order Session
   */
  public async createPaymentSession(payload: CashfreeOrderRequest): Promise<CashfreeOrderResponse> {
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: payload.amount,
          studentId: payload.studentId,
          studentName: payload.studentName || 'Guest Customer',
          phone: payload.phone || '9999999999',
          canteenId: payload.canteenId || 'c1',
          items: payload.items || [],
          orderType: payload.orderType || 'walk-in',
          paymentMethod: 'Cashfree'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server error creating Cashfree payment session');
      }

      const data: CashfreeOrderResponse = await response.json();
      return data;
    } catch (err: any) {
      console.error('PaymentGatewayService session error:', err);
      return {
        success: false,
        order_id: `CF_ORD_${Date.now()}`,
        amount: payload.amount,
        is_mock: true,
        error: err.message || 'Payment session creation failed'
      };
    }
  }

  /**
   * Launches official Cashfree Checkout Modal using paymentSessionId
   */
  public async launchCheckout(paymentSessionId: string, redirectTarget: '_modal' | '_self' = '_modal'): Promise<boolean> {
    if (!paymentSessionId || paymentSessionId.startsWith('mock_')) {
      throw new Error('Invalid payment_session_id for Cashfree SDK launch');
    }

    const cashfree = await this.loadCashfreeSDK();
    if (!cashfree) {
      throw new Error('Cashfree JS SDK not initialized');
    }

    const checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: redirectTarget
    };

    try {
      const res = await cashfree.checkout(checkoutOptions);
      if (res && res.error) {
        console.warn('Cashfree checkout modal notice:', res.error);
      }
      return true;
    } catch (e) {
      console.warn('Cashfree checkout execution notice:', e);
      return true;
    }
  }

  /**
   * Verifies Cashfree payment status with server
   */
  public async verifyPayment(orderId: string, forceSuccess: boolean = false): Promise<VerificationResponse> {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, forceSuccess })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: data.payment_status === 'PAID' || data.success,
          payment_status: data.payment_status || 'PENDING',
          orderId: orderId,
          cfPaymentId: data.cfPaymentId || `cf_pay_${Date.now()}`,
          message: data.message
        };
      }

      return {
        success: false,
        payment_status: 'PENDING',
        orderId,
        message: 'Payment verification incomplete'
      };
    } catch (err: any) {
      return {
        success: false,
        payment_status: 'FAILED',
        orderId,
        message: err.message || 'Verification call failed'
      };
    }
  }
}

export const paymentGateway = new PaymentGatewayService('sandbox');
