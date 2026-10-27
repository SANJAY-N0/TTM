import React from 'react';
import { CashfreeCheckoutModal, CashfreeCheckoutModalProps } from './CashfreeCheckoutModal';

export const WalkInPayment: React.FC<CashfreeCheckoutModalProps> = (props) => {
  return <CashfreeCheckoutModal {...props} />;
};

export default WalkInPayment;
