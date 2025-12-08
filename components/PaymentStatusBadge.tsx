import React from 'react';
import { PaymentStatus } from '../types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case PaymentStatus.Paid:
        return 'bg-green-100 text-green-700 border-green-300';
      case PaymentStatus.Due:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case PaymentStatus.Overdue:
        return 'bg-red-100 text-red-700 border-red-300';
      case PaymentStatus.Processing:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyles()} ${className}`}
    >
      {status}
    </span>
  );
};

export default PaymentStatusBadge;
