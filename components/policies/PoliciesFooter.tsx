import React from 'react';

const verse = 'وَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ';
const ref = 'صدق الله العظيم  |  سورة الضحى: 9';
const notice = 'هذا الدليل وثيقةٌ حيّة تُراجَع سنوياً أو كلما دعت الحاجة.';
const org = 'جمعية فيء لرعاية الأيتام  |  الإصدار الأول 1445هـ';

export function PoliciesFooter() {
  return (
    <footer className="bg-bg-card border-t border-gray-200 mt-12 py-10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 text-center">
        <blockquote className="text-xl md:text-2xl font-medium text-primary mb-2">
          ﴿ {verse} ﴾
        </blockquote>
        <p className="text-sm text-text-secondary">{ref}</p>
        <p className="text-text-secondary mt-6 text-base">{notice}</p>
        <p className="text-sm text-text-secondary mt-4">{org}</p>
      </div>
    </footer>
  );
}
