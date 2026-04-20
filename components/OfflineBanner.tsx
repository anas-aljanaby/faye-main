import React from 'react';

const OfflineBanner: React.FC = () => {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800">
      أنت غير متصل بالإنترنت حالياً. قد تعمل بعض الصفحات ببيانات محفوظة فقط.
    </div>
  );
};

export default OfflineBanner;
