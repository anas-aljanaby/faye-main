import React from 'react';

interface PolicySubSectionProps {
  title: string;
  children: React.ReactNode;
}

export function PolicySubSection({ title, children }: PolicySubSectionProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{title}</h3>
      <div className="text-base text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}
