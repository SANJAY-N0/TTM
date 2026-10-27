export const getCashfreeInstance = async () => {
  if ((window as any).Cashfree) {
    return (window as any).Cashfree({ mode: 'sandbox' });
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('cashfree-js-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        resolve((window as any).Cashfree ? (window as any).Cashfree({ mode: 'sandbox' }) : null);
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'cashfree-js-sdk';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => {
      resolve((window as any).Cashfree ? (window as any).Cashfree({ mode: 'sandbox' }) : null);
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree JS SDK'));
    document.body.appendChild(script);
  });
};

export const initiateCashfreeCheckout = async (paymentSessionId: string, returnUrl?: string) => {
  const cashfree: any = await getCashfreeInstance();
  if (cashfree && typeof cashfree.checkout === 'function') {
    return cashfree.checkout({
      paymentSessionId,
      redirectTarget: '_modal',
    });
  }
};
