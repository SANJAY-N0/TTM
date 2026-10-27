import React from 'react';
import { CashfreeCheckoutModal, CashfreeCheckoutModalProps } from './CashfreeCheckoutModal';

export const CashfreePaymentGateway: React.FC<CashfreeCheckoutModalProps> = (props) => {
  return <CashfreeCheckoutModal {...props} />;
};

export default CashfreePaymentGateway;
