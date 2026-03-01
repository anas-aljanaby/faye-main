import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
              className={`w-full text-right py-2 px-3 rounded-lg text-sm transition-colors ${
                activeId === item.id
                  ? 'bg-primary-light text-primary font-semibold'
                  : 'text-gray-600 hover:bg-primary-light hover:text-primary'
              }`}
            >
              <span className="font-medium text-primary ml-1">{i + 1}.</span>
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
        className="hidden lg:block bg-bg-card rounded-xl border border-gray-200 p-4 shadow-sm"
        aria-label="فهرس السياسات"
      >
        <TocList activeId={activeId} onSelect={onSelect} />
      </nav>

      {/* Mobile: FAB + drawer */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="fixed bottom-4 left-4 z-30 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="فتح فهرس المحتويات"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>

        {isDrawerOpen &&
          createPortal(
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40"
                aria-hidden
                onClick={() => setIsDrawerOpen(false)}
              />
              <div
                className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-bg-card border-l border-gray-200 shadow-xl z-50 overflow-auto p-4"
                role="dialog"
                aria-label="فهرس المحتويات"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="font-bold text-gray-800 text-sm">فهرس المحتويات</h2>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="إغلاق"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <TocList
                  activeId={activeId}
                  onSelect={onSelect}
                  onSelectAndClose={() => setIsDrawerOpen(false)}
                  showTitle={false}
                />
              </div>
            </>,
            document.body
          )}
      </div>
    </>
  );
}
