import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'normal' | 'large';
export type BrandColor = 'default' | 'blue' | 'green' | 'purple' | 'orange';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  brandColor: BrandColor;
  setBrandColor: (color: BrandColor) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const BRAND_COLORS: Record<BrandColor, { primary: string; hover: string; light: string }> = {
  default: { primary: '#8c1c3e', hover: '#701631', light: '#fbe9ef' },
  blue: { primary: '#2563eb', hover: '#1d4ed8', light: '#dbeafe' },
  green: { primary: '#059669', hover: '#047857', light: '#d1fae5' },
  purple: { primary: '#7c3aed', hover: '#6d28d9', light: '#ede9fe' },
  orange: { primary: '#ea580c', hover: '#c2410c', light: '#ffedd5' },
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
      return (saved as BrandColor) || 'default';
    } catch {
      return 'default';
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
    try {
      const root = window.document.documentElement;
      const colors = BRAND_COLORS[brandColor];
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-primary-hover', colors.hover);
      root.style.setProperty('--color-primary-light', colors.light);
      localStorage.setItem('theme_color', brandColor);
    } catch (e) {
      console.error('Failed to apply brand color:', e);
    }
  }, [brandColor]);

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
      fontSize,
      setFontSize,
    }),
    [mode, brandColor, fontSize]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
