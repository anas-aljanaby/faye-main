import React from 'react';

type Variant = 'info' | 'warning' | 'danger';

interface CalloutProps {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  danger: 'bg-red-50 border-red-200 text-red-900',
};

export function Callout({ variant = 'info', title, children, className = '' }: CalloutProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      {title && <p className="font-semibold mb-2">{title}</p>}
      <div className="text-base">{children}</div>
    </div>
  );
}
