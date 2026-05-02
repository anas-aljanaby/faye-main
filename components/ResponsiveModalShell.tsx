import React, { ReactNode, useId } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ResponsiveModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  titleId?: string;
  maxWidthClassName?: string;
  zIndexClassName?: string;
  overlayClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  closeDisabled?: boolean;
}

const joinClasses = (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(' ');

const ResponsiveModalShell: React.FC<ResponsiveModalShellProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  titleId,
  maxWidthClassName = 'md:max-w-lg',
  zIndexClassName = 'z-[120]',
  overlayClassName,
  panelClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  closeDisabled = false,
}) => {
  const generatedTitleId = useId();
  const resolvedTitleId = titleId ?? generatedTitleId;

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!closeDisabled) {
      onClose();
    }
  };

  return (
    <div
      className={joinClasses(
        'fixed inset-0 flex items-end justify-center bg-black/55 p-0 md:items-center md:p-4',
        zIndexClassName,
        overlayClassName
      )}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={joinClasses(
          'flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-bg-card shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-[1.75rem]',
          maxWidthClassName,
          panelClassName
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
      >
        <div className="flex justify-center pt-2 md:hidden">
          <span className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div
          className={joinClasses(
            'flex items-start justify-between gap-3 border-b border-gray-100 bg-bg-card px-4 py-3 md:px-6 md:py-5',
            headerClassName
          )}
        >
          <div className="min-w-0 flex-1">
            <h2 id={resolvedTitleId} className="text-lg font-bold leading-7 text-text-primary md:text-2xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={closeDisabled}
            aria-label="إغلاق النافذة"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 md:h-11 md:w-11"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={joinClasses('min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5', bodyClassName)}>
          {children}
        </div>

        {footer ? (
          <div
            className={joinClasses(
              'shrink-0 border-t border-gray-100 bg-bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:py-4 md:pb-5',
              footerClassName
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ResponsiveModalShell;
