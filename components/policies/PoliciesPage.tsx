import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PoliciesLayout } from './PoliciesLayout';
import { PoliciesHeader } from './PoliciesHeader';
import { PoliciesFooter } from './PoliciesFooter';
import { PoliciesContent } from './PoliciesContent';
import { POLICIES_TOC } from './data';
import { usePoliciesNav } from './PoliciesNavContext';

export function PoliciesPage() {
  const [activeId, setActiveId] = useState(POLICIES_TOC[0].id);
  const [printMode, setPrintMode] = useState(false);
  const contentRef = useRef<HTMLElement | null>(null);
  const { setPoliciesNav } = usePoliciesNav();

  const handlePrint = useCallback(() => {
    setPrintMode(true);
  }, []);

  const handleSelectSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    setPoliciesNav({ activeId, onSelectSection: handleSelectSection });
    return () => setPoliciesNav(null);
  }, [activeId, handleSelectSection, setPoliciesNav]);

  useEffect(() => {
    if (!printMode) return;
    const id = setTimeout(() => window.print(), 100);
    return () => clearTimeout(id);
  }, [printMode]);

  useEffect(() => {
    const onAfterPrint = () => setPrintMode(false);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  useEffect(() => {
    const main = contentRef.current;
    if (!main) return;
    const sections = main.querySelectorAll('section[id^="policy-"]');
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length === 0) return;
        const byTop = [...intersecting].sort(
          (a, b) => (a.boundingClientRect?.top ?? 0) - (b.boundingClientRect?.top ?? 0)
        );
        const first = byTop[0];
        if (first?.target?.id) setActiveId(first.target.id);
      },
      { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <PoliciesLayout
      header={<PoliciesHeader onPrint={handlePrint} />}
      footer={<PoliciesFooter />}
      contentRef={contentRef}
    >
      <PoliciesContent />
    </PoliciesLayout>
  );
}
