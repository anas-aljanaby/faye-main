import React from 'react';
import { POLICIES_TOC } from './data';

interface PolicySectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function PolicySection({ id, title, children }: PolicySectionProps) {
  const policyData = POLICIES_TOC.find((p) => p.id === id);
  const number = policyData?.number;

  return (
    <section
      id={id}
      className="policy-section scroll-mt-24 mb-10 print:break-before-page print:first:break-before-auto border-r-4 border-primary pr-4 md:pr-6"
    >
      <div className="flex items-baseline gap-3 mb-4 mt-8 first:mt-0">
        {number && (
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-light text-primary font-bold text-sm flex-shrink-0">
            {number}
          </span>
        )}
        <h2 className="text-2xl font-bold text-primary">
          {title}
        </h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
