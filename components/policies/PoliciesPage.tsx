import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PoliciesLayout } from './PoliciesLayout';
import { PoliciesHeader } from './PoliciesHeader';
import { PoliciesFooter } from './PoliciesFooter';
import { PoliciesContent } from './PoliciesContent';
import { PoliciesSidebar } from './PoliciesSidebar';
import { POLICIES_TOC } from './data';
import { usePoliciesNav } from './PoliciesNavContext';

export function PoliciesPage() {
  const [activeId, setActiveId] = useState(POLICIES_TOC[0].id);
  const [printMode, setPrintMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
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
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = height > 0 ? (winScroll / height) * 100 : 0;
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    <>
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-light to-primary z-50 print:hidden"
        style={{ width: `${readingProgress}%`, transition: 'width 0.1s ease-out' }}
      />
      <PoliciesLayout
        header={<PoliciesHeader onPrint={handlePrint} />}
        sidebar={<PoliciesSidebar activeId={activeId} onSelect={handleSelectSection} />}
        footer={<PoliciesFooter />}
        contentRef={contentRef}
      >
        <PoliciesContent />
      </PoliciesLayout>
    </>
  );
}
