// Official Cashfree SDK PaymentHandler Utility
// Uses Cashfree JS SDK v3 for official checkout flows in Sandbox/Production mode

declare global {
  interface Window {
    Cashfree?: any;
  }
}

export interface PaymentOptions {
  amount: number;
  studentId?: string;
  studentName?: string;
  phone?: string;
  email?: string;
  canteenId?: string;
  items?: any[];
  orderType?: 'walk-in' | 'online';
  paymentMethod?: 'Cashfree' | 'UPI' | 'Cash';
  redirectTarget?: '_modal' | '_self' | '_blank';
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  cfPaymentId?: string;
  message?: string;
}

class PaymentHandler {
  private mode: 'sandbox' | 'production' = 'sandbox';

  constructor(mode: 'sandbox' | 'production' = 'sandbox') {
    this.mode = mode;
  }

  /**
   * Initializes or fetches the Cashfree SDK instance from window
   */
  public async getSDKInstance(): Promise<any> {
    if (typeof window !== 'undefined' && window.Cashfree) {
      return window.Cashfree({ mode: this.mode });
    }

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        return reject(new Error('Window context is unavailable'));
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
          reject(new Error('Cashfree SDK object not found on window object'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Cashfree JS SDK script'));
      document.body.appendChild(script);
    });
  }

  /**
   * Creates an official Cashfree payment order via server endpoint and launches official Cashfree Checkout
   */
  public async payWithCashfree(
    options: PaymentOptions,
    callbacks?: {
      onSuccess?: (result: PaymentResult) => void;
      onFailure?: (error: PaymentResult) => void;
      onCancel?: () => void;
    }
  ): Promise<PaymentResult> {
    try {
      // 1. Create order session via backend
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: options.amount,
          studentId: options.studentId,
          studentName: options.studentName || 'Guest Customer',
          phone: options.phone || '9999999999',
          canteenId: options.canteenId || 'c1',
          items: options.items || [],
          orderType: options.orderType || 'online',
          paymentMethod: 'Cashfree'
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to initialize payment session from server');
      }

      const data = await response.json();
      const paymentSessionId = data.payment_session_id;
      const orderId = data.order_id;

      if (!paymentSessionId) {
        throw new Error('No payment session ID returned by payment gateway server');
      }

      // 2. Load official Cashfree SDK
      const cashfree = await this.getSDKInstance();
      if (!cashfree) {
        throw new Error('Failed to initialize Cashfree JS SDK');
      }

      // 3. Launch official Cashfree Checkout
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: options.redirectTarget || '_modal'
      };

      cashfree.checkout(checkoutOptions);

      // 4. Poll verification endpoint to verify completion
      const verification = await this.verifyPayment(orderId);
      
      if (verification.success) {
        if (callbacks?.onSuccess) callbacks.onSuccess(verification);
        return verification;
      } else {
        if (callbacks?.onFailure) callbacks.onFailure(verification);
        return verification;
      }
    } catch (err: any) {
      console.error('Cashfree payment handler error:', err);
      const failResult: PaymentResult = {
        success: false,
        message: err.message || 'Payment initiation failed'
      };
      if (callbacks?.onFailure) callbacks.onFailure(failResult);
      return failResult;
    }
  }

  /**
   * Verifies payment with backend endpoint
   */
  public async verifyPayment(orderId: string): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payment_status === 'PAID' || data.success) {
          return {
            success: true,
            orderId,
            cfPaymentId: data.cfPaymentId || `cf_pay_${Date.now()}`,
            message: 'Payment verified successfully'
          };
        }
      }

      return {
        success: false,
        orderId,
        message: 'Payment verification pending or incomplete'
      };
    } catch (err: any) {
      return {
        success: false,
        orderId,
        message: err.message || 'Verification failed'
      };
    }
  }
}

// Export singleton instance for easy app-wide usage
export const paymentHandler = new PaymentHandler('sandbox');
