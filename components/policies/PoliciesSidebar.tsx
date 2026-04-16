import React, { useState } from 'react';
import { POLICIES_TOC } from './data';

interface PoliciesSidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
}

function TocList({
  activeId,
  onSelect,
  onSelectAndClose,
  showTitle = true,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onSelectAndClose?: (id: string) => void;
  showTitle?: boolean;
}) {
  const handleClick = (id: string) => {
    onSelect(id);
    onSelectAndClose?.(id);
  };
  return (
    <>
      {showTitle && (
        <h3 className="font-bold text-gray-800 text-sm mb-3">فهرس المحتويات</h3>
      )}
      <ul className="space-y-1">
        {POLICIES_TOC.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => handleClick(item.id)}
              className={`w-full rounded-xl px-3 py-2.5 text-right text-sm transition-colors ${
                activeId === item.id
                  ? 'bg-primary-light text-primary font-semibold'
                  : 'text-gray-600 hover:bg-primary-light hover:text-primary'
              }`}
            >
              <span className="font-medium text-primary me-1">{i + 1}.</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function PoliciesSidebar({ activeId, onSelect }: PoliciesSidebarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Desktop: sidebar card */}
      <nav
        className="hidden rounded-2xl border border-gray-200 bg-bg-card p-4 shadow-sm lg:block"
        aria-label="فهرس السياسات"
      >
        <TocList activeId={activeId} onSelect={onSelect} />
      </nav>

      {/* Mobile: collapsible top section */}
      <div className="lg:hidden">
        <div className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-bg-card shadow-sm">
          <button
            type="button"
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-right"
            aria-expanded={isDrawerOpen}
            aria-controls="policies-mobile-toc"
          >
            <div>
              <p className="text-sm font-semibold text-primary">تنقل سريع</p>
              <p className="mt-1 text-sm text-text-secondary">افتح فهرس السياسات واختر القسم المطلوب</p>
            </div>
            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-transform ${
                isDrawerOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          {isDrawerOpen && (
            <div id="policies-mobile-toc" className="border-t border-gray-200 px-3 py-3">
              <TocList
                activeId={activeId}
                onSelect={onSelect}
                onSelectAndClose={handleSelect}
                showTitle={false}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
