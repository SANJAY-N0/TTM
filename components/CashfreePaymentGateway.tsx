import React from 'react';
import { CashfreeCheckoutModal, CashfreeCheckoutModalProps } from './payment_gateway';

export const CashfreePaymentGateway: React.FC<CashfreeCheckoutModalProps> = (props) => {
  return <CashfreeCheckoutModal {...props} />;
};
