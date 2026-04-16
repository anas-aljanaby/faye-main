import React from 'react';

const tagline = 'تأصيل العمل  |  تنظيم العلاقات  |  ضمان الحقوق  |  الحوكمة الرشيدة';
const version = '1445 هـ  |  2024 م';
const badge = 'الإصدار الأول';

interface PoliciesHeaderProps {
  onPrint?: () => void;
}

export function PoliciesHeader({ onPrint }: PoliciesHeaderProps) {
  return (
    <header className="bg-bg-card border-b border-gray-200 shadow-sm print:border-0">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary leading-tight">
              سياسات فيء لرعاية الأيتام
            </h1>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{tagline}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-secondary">
              <span>{version}</span>
              <span className="px-2 py-0.5 bg-primary-light text-primary rounded print:bg-transparent print:border print:border-gray-400">{badge}</span>
            </div>
          </div>
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="print:hidden inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 sm:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              </svg>
              طباعة / PDF
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
