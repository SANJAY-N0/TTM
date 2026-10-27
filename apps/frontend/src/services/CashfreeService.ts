export const CashfreeService = {
  /**
   * Dynamically loads the official Cashfree JS SDK script if not already present in DOM
   */
  async loadSdkScript(): Promise<void> {
    if ((window as any).Cashfree) return;

    return new Promise((resolve, reject) => {
      const existingScript = document.getElementById('cashfree-js-sdk');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.id = 'cashfree-js-sdk';
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load official Cashfree SDK script'));
      document.body.appendChild(script);
    });
  },

  /**
   * Initializes and returns the official Cashfree JS SDK instance
   */
  async getInstance(mode: 'sandbox' | 'production' = 'sandbox'): Promise<any> {
    if ((window as any).Cashfree) {
      return (window as any).Cashfree({ mode });
    }

    try {
      await this.loadSdkScript();
      if ((window as any).Cashfree) {
        return (window as any).Cashfree({ mode });
      }
    } catch (err) {
      console.warn('Cashfree script loading warning:', err);
    }

    throw new Error('Cashfree SDK is unavailable in browser environment');
  },

  /**
   * Opens the official Cashfree Payment Gateway checkout as an in-app modal dialog
   */
  async openCheckoutModal(paymentSessionId: string, mode: 'sandbox' | 'production' = 'sandbox'): Promise<void> {
    try {
      const cashfreeInstance = await this.getInstance(mode);
      if (cashfreeInstance && typeof cashfreeInstance.checkout === 'function') {
        await cashfreeInstance.checkout({
          paymentSessionId,
          redirectTarget: '_modal'
        });
      } else {
        throw new Error('Cashfree SDK checkout function unavailable');
      }
    } catch (error) {
      console.error('Failed to open Cashfree Checkout modal:', error);
      throw error;
    }
  }
};
