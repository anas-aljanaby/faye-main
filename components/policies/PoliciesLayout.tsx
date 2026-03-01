import React from 'react';

interface PoliciesLayoutProps {
  header: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  contentRef?: React.RefObject<HTMLElement | null>;
}

/**
 * RTL layout for the Policies guide: hero header, main content with sidebar TOC, and footer.
 * Two-column on desktop, single column on mobile.
 */
export function PoliciesLayout({ header, sidebar, children, footer, contentRef }: PoliciesLayoutProps) {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 text-text-primary policies-layout">
      <style>{`
        @media print {
          .policies-layout aside { display: none !important; }
          .policies-layout .policies-content section.policy-section:not(:first-child) { break-before: page; }
        }
      `}</style>
      {header}
      <div className="flex flex-col lg:flex-row gap-2 p-4 sm:p-6 md:p-8 max-w-6xl ms-0 me-auto print:gap-0 print:p-0 print:flex-col print:mx-auto">
        <main ref={contentRef} className="flex-1 min-w-0 max-w-3xl print:max-w-none">
          {children}
        </main>
        {sidebar != null && (
          <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-20 lg:self-start print:hidden">
            {sidebar}
          </aside>
        )}
      </div>
      {footer}
    </div>
  );
}
