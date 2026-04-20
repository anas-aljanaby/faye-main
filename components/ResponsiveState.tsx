import React, { ReactNode } from 'react';

interface ResponsiveStateProps {
  variant?: 'loading' | 'empty' | 'error';
  title: string;
  description?: string;
  fullScreen?: boolean;
  compact?: boolean;
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
}

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const StateIcon: React.FC<{ variant: NonNullable<ResponsiveStateProps['variant']> }> = ({ variant }) => {
  if (variant === 'loading') {
    return (
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary md:h-16 md:w-16">
        <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <span className="absolute inset-[5px] animate-spin rounded-full border-[3px] border-primary/15 border-t-primary" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative z-10"
        >
          <path d="M12 3v3" />
          <path d="M18.36 5.64l-2.12 2.12" />
          <path d="M21 12h-3" />
          <path d="M18.36 18.36l-2.12-2.12" />
          <path d="M12 18v3" />
          <path d="M5.64 18.36l2.12-2.12" />
          <path d="M3 12h3" />
          <path d="M5.64 5.64l2.12 2.12" />
        </svg>
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 md:h-16 md:w-16">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m10.29 3.86-7.4 12.84A2 2 0 0 0 4.6 19.7h14.8a2 2 0 0 0 1.73-3l-7.4-12.84a2 2 0 0 0-3.44 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 md:h-16 md:w-16">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5Z" />
        <path d="M8 10h8" />
        <path d="M8 14h5" />
      </svg>
    </div>
  );
};

const defaultLoadingContent = (
  <div className="mx-auto mt-5 w-full max-w-xs space-y-3">
    <div className="h-3 w-24 animate-pulse rounded-full bg-primary/15" />
    <div className="h-3 w-full animate-pulse rounded-full bg-gray-200" />
    <div className="h-3 w-4/5 animate-pulse rounded-full bg-gray-200" />
    <div className="grid grid-cols-2 gap-3 pt-2">
      <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
      <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
    </div>
  </div>
);

const ResponsiveState: React.FC<ResponsiveStateProps> = ({
  variant = 'empty',
  title,
  description,
  fullScreen = false,
  compact = false,
  className,
  contentClassName,
  children,
}) => {
  const card = (
    <div
      className={joinClasses(
        'w-full rounded-[1.75rem] border border-gray-100 bg-bg-card shadow-sm',
        compact ? 'px-4 py-6 md:px-5 md:py-7' : 'px-5 py-8 md:px-6 md:py-10',
        className
      )}
    >
      <div className={joinClasses('mx-auto flex max-w-md flex-col items-center text-center', contentClassName)}>
        <StateIcon variant={variant} />
        <h2 className="mt-4 text-lg font-bold text-text-primary md:text-xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-sm text-sm leading-7 text-text-secondary break-words md:text-base">
            {description}
          </p>
        ) : null}
        {children ?? (variant === 'loading' ? defaultLoadingContent : null)}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg-page px-4 py-6 md:px-6">
        <div className="w-full max-w-lg">{card}</div>
      </div>
    );
  }

  return card;
};

export default ResponsiveState;
