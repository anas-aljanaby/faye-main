import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PwaUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Service worker registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-primary/20 bg-white p-4 shadow-xl md:inset-x-auto md:start-6 md:w-[26rem]">
      <p className="text-sm font-semibold text-text-primary">يوجد إصدار جديد من التطبيق.</p>
      <p className="mt-1 text-sm text-text-secondary">حدّث الآن للحصول على أحدث التحسينات.</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          تحديث الآن
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          لاحقاً
        </button>
      </div>
    </div>
  );
};

export default PwaUpdatePrompt;
