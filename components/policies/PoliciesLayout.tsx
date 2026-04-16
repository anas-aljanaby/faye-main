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
      <div className="mx-auto flex max-w-[2000px] flex-col gap-4 px-4 py-4 sm:px-5 md:px-8 md:py-8 lg:flex-row lg:gap-6 print:mx-auto print:flex-col print:gap-0 print:p-0">
        {sidebar != null && (
          <div className="print:hidden lg:hidden">
            {sidebar}
          </div>
        )}
        <main ref={contentRef} className="min-w-0 flex-1 print:max-w-none">
          <div className="policies-content space-y-6 rounded-[1.75rem] bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5 md:space-y-8 md:p-8 print:rounded-none print:bg-transparent print:p-0 print:shadow-none print:ring-0 [&_p]:text-base [&_p]:leading-8 [&_li]:text-base [&_li]:leading-8 [&_ol]:space-y-2 [&_ul]:space-y-2">
            {children}
          </div>
        </main>
        {sidebar != null && (
          <aside className="hidden w-full shrink-0 print:hidden lg:block lg:w-72 lg:self-start lg:sticky lg:top-20">
            {sidebar}
          </aside>
        )}
      </div>
      {footer}
    </div>
  );
}
