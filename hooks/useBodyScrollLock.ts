import { useEffect } from 'react';

/** App layout scrolls inside `<main id={APP_MAIN_SCROLL_ROOT_ID}>` (see App.tsx), not the body. */
export const APP_MAIN_SCROLL_ROOT_ID = 'app-main-scroll';

let lockDepth = 0;
let savedBodyOverflow = '';
let savedHtmlOverflow = '';
let savedMainOverflow = '';
let mainEl: HTMLElement | null = null;

export const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;

    lockDepth += 1;
    if (lockDepth === 1) {
      const { body, documentElement } = document;
      savedBodyOverflow = body.style.overflow;
      savedHtmlOverflow = documentElement.style.overflow;
      body.style.overflow = 'hidden';
      documentElement.style.overflow = 'hidden';

      mainEl = document.getElementById(APP_MAIN_SCROLL_ROOT_ID);
      if (mainEl) {
        savedMainOverflow = mainEl.style.overflow;
        mainEl.style.overflow = 'hidden';
      }
    }

    return () => {
      lockDepth -= 1;
      if (lockDepth !== 0) return;

      document.body.style.overflow = savedBodyOverflow;
      document.documentElement.style.overflow = savedHtmlOverflow;
      if (mainEl) {
        mainEl.style.overflow = savedMainOverflow;
      }
      mainEl = null;
    };
  }, [locked]);
};
