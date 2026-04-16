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
      className="policy-section mb-10 scroll-mt-24 border-s-4 border-primary ps-4 print:break-before-page print:first:break-before-auto md:ps-6"
    >
      <div className="mt-8 mb-4 flex items-start gap-3 first:mt-0 md:items-baseline">
        {number && (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary md:h-10 md:w-10">
            {number}
          </span>
        )}
        <h2 className="text-xl font-bold leading-8 text-primary md:text-2xl">
          {title}
        </h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
