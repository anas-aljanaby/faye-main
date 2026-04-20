import React, { useState } from 'react';
import PasswordInput from '../PasswordInput';

interface Props {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  error?: string;
  showCopy?: boolean;
}

const PasswordFieldWithActions: React.FC<Props> = ({
  label,
  value,
  onChange,
  onGenerate,
  error,
  showCopy = false,
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'failed'>('idle');

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyState('done');
      setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 1800);
    }
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGenerate}
            className="min-h-[44px] rounded-lg px-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            توليد عشوائي
          </button>
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              disabled={!value}
              className="min-h-[44px] rounded-lg px-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copyState === 'done' ? 'تم النسخ' : copyState === 'failed' ? 'فشل النسخ' : 'نسخ'}
            </button>
          )}
        </div>
      </div>
      <PasswordInput
        value={value}
        onChange={onChange}
        autoComplete="new-password"
        inputClassName="min-h-[48px] py-2.5 font-mono text-sm"
        placeholder="8 أحرف على الأقل"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default PasswordFieldWithActions;
