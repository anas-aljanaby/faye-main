import React, { InputHTMLAttributes, useId, useState } from 'react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  inputClassName?: string;
  inputDir?: 'ltr' | 'rtl' | 'auto';
}

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const EyeIcon: React.FC<{ open: boolean }> = ({ open }) => {
  if (open) {
    return (
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
        <path d="M2.06 12.35a1 1 0 0 1 0-.7C3.48 8.04 7.06 5 12 5s8.52 3.04 9.94 6.65a1 1 0 0 1 0 .7C20.52 15.96 16.94 19 12 19s-8.52-3.04-9.94-6.65Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
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
      <path d="m3 3 18 18" />
      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c4.94 0 8.52 3.04 9.94 6.65a1 1 0 0 1 0 .7 10.8 10.8 0 0 1-4.24 5.13" />
      <path d="M6.61 6.61A10.75 10.75 0 0 0 2.06 11.65a1 1 0 0 0 0 .7C3.48 15.96 7.06 19 12 19a10.9 10.9 0 0 0 5.39-1.39" />
    </svg>
  );
};

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  labelClassName,
  wrapperClassName,
  inputClassName,
  inputDir = 'ltr',
  className: _ignoredClassName,
  ...inputProps
}) => {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={wrapperClassName}>
      {label ? (
        <label htmlFor={resolvedId} className={joinClasses('mb-2 block text-sm font-medium text-gray-700', labelClassName)}>
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          {...inputProps}
          id={resolvedId}
          type={isVisible ? 'text' : 'password'}
          dir={inputDir}
          className={joinClasses(
            'w-full rounded-xl border border-gray-300 bg-white py-3 ps-4 pe-14 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary md:text-base',
            inputClassName
          )}
        />

        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="absolute end-2 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary"
          aria-label={isVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          title={isVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          <EyeIcon open={isVisible} />
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;
