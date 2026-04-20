import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useOrganization } from './OrganizationContext';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'normal' | 'large';
export type BrandColor = 'organization' | 'blue' | 'green' | 'purple' | 'orange';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  brandColor: BrandColor;
  setBrandColor: (color: BrandColor) => void;
  brandColorLocked: boolean;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const BRAND_COLORS: Record<Exclude<BrandColor, 'organization'>, { primary: string; hover: string; light: string }> = {
  blue: { primary: '#2563eb', hover: '#1d4ed8', light: '#dbeafe' },
  green: { primary: '#059669', hover: '#047857', light: '#d1fae5' },
  purple: { primary: '#7c3aed', hover: '#6d28d9', light: '#ede9fe' },
  orange: { primary: '#ea580c', hover: '#c2410c', light: '#ffedd5' },
};

const normalizeSavedBrandColor = (value: string | null): BrandColor => {
  if (value === 'blue' || value === 'green' || value === 'purple' || value === 'orange') {
    return value;
  }

  return 'organization';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organization } = useOrganization();
  const brandColorLocked = organization.allowUserThemeColorOverride !== true;

  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('theme_mode');
      return (saved as ThemeMode) || 'light';
    } catch {
      return 'light';
    }
  });

  const [brandColor, setBrandColor] = useState<BrandColor>(() => {
    try {
      const saved = localStorage.getItem('theme_color');
      return normalizeSavedBrandColor(saved);
    } catch {
      return 'organization';
    }
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    try {
      const saved = localStorage.getItem('theme_fontsize');
      return (saved as FontSize) || 'normal';
    } catch {
      return 'normal';
    }
  });

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      let effectiveMode = mode;
      if (mode === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveMode = systemPrefersDark ? 'dark' : 'light';
      }

      root.classList.add(effectiveMode);
      localStorage.setItem('theme_mode', mode);
    } catch (e) {
      console.error('Failed to apply theme mode:', e);
    }
  }, [mode]);

  useEffect(() => {
    if (brandColorLocked && brandColor !== 'organization') {
      setBrandColor('organization');
    }
  }, [brandColor, brandColorLocked]);

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      let effectiveMode = mode;
      if (mode === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveMode = systemPrefersDark ? 'dark' : 'light';
      }

      const palette = organization.theme[effectiveMode];
      const accent =
        brandColor === 'organization' || brandColorLocked
          ? {
              primary: palette.primary,
              hover: palette.primaryHover,
              light: palette.primaryLight,
            }
          : BRAND_COLORS[brandColor];

      root.style.setProperty('--color-primary', accent.primary);
      root.style.setProperty('--color-primary-hover', accent.hover);
      root.style.setProperty('--color-primary-light', accent.light);
      root.style.setProperty('--bg-page', palette.pageBackground);
      root.style.setProperty('--bg-sidebar', palette.sidebarBackground);
      root.style.setProperty('--bg-card', palette.cardBackground);
      root.style.setProperty('--text-primary', palette.textPrimary);
      root.style.setProperty('--text-secondary', palette.textSecondary);
      localStorage.setItem('theme_color', brandColorLocked ? 'organization' : brandColor);

      const themeColorMeta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.content =
          brandColor === 'organization' || brandColorLocked
            ? palette.browserThemeColor
            : accent.primary;
      }
    } catch (e) {
      console.error('Failed to apply brand color:', e);
    }
  }, [brandColor, brandColorLocked, mode, organization]);

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      let scale = '100%';
      if (fontSize === 'small') scale = '87.5%';
      if (fontSize === 'large') scale = '112.5%';
      root.style.fontSize = scale;
      localStorage.setItem('theme_fontsize', fontSize);
    } catch (e) {
      console.error('Failed to apply font size:', e);
    }
  }, [fontSize]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      brandColor,
      setBrandColor,
      brandColorLocked,
      fontSize,
      setFontSize,
    }),
    [mode, brandColor, brandColorLocked, fontSize]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
