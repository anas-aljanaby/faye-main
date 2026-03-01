import React from 'react';

interface PolicySectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function PolicySection({ id, title, children }: PolicySectionProps) {
  return (
    <section id={id} className="policy-section scroll-mt-24 mb-10 print:break-before-page print:first:break-before-auto">
      <h2 className="text-2xl font-bold text-primary border-b border-gray-200 pb-2 mt-8 mb-4 first:mt-0">
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
