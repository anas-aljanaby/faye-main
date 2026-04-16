import React from 'react';

interface PolicySubSectionProps {
  title: string;
  children: React.ReactNode;
}

export function PolicySubSection({ title, children }: PolicySubSectionProps) {
  return (
    <div>
      <h3 className="mb-3 mt-6 text-lg font-semibold text-gray-800 md:text-xl">{title}</h3>
      <div className="text-base leading-8 text-gray-600">{children}</div>
    </div>
  );
}
