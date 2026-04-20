import React, { createContext, useContext, useEffect, useMemo } from 'react';
import {
  buildOrganizationOrigin,
  getCanonicalHostname,
  resolveOrganizationForHostname,
  type OrganizationConfig,
  type OrganizationResolution,
} from '../config/organizations';

interface OrganizationContextValue {
  organization: OrganizationConfig;
  resolution: OrganizationResolution;
  canonicalHostname: string;
  canonicalOrigin: string;
  canonicalUrl: string;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

const ensureHeadLink = (
  selector: string,
  defaults: Record<string, string>
): HTMLLinkElement => {
  const existing = document.head.querySelector<HTMLLinkElement>(selector);
  if (existing) {
    return existing;
  }

  const link = document.createElement('link');
  Object.entries(defaults).forEach(([key, value]) => {
    link.setAttribute(key, value);
  });
  document.head.appendChild(link);
  return link;
};

const ensureHeadMeta = (
  selector: string,
  defaults: Record<string, string>
): HTMLMetaElement => {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) {
    return existing;
  }

  const meta = document.createElement('meta');
  Object.entries(defaults).forEach(([key, value]) => {
    meta.setAttribute(key, value);
  });
  document.head.appendChild(meta);
  return meta;
};

const getAssetMimeType = (assetPath: string) => {
  if (assetPath.endsWith('.png')) {
    return 'image/png';
  }

  if (assetPath.endsWith('.webp')) {
    return 'image/webp';
  }

  if (assetPath.endsWith('.svg')) {
    return 'image/svg+xml';
  }

  return '';
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const resolution = useMemo(() => {
    if (typeof window === 'undefined') {
      return resolveOrganizationForHostname('localhost');
    }

    return resolveOrganizationForHostname(window.location.hostname);
  }, []);

  const value = useMemo<OrganizationContextValue>(() => {
    const canonicalHostname = getCanonicalHostname(resolution.organization);
    const canonicalOrigin = buildOrganizationOrigin(resolution.organization);
    const canonicalUrl = `${canonicalOrigin}${typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}${window.location.hash}` : ''}`;

    return {
      organization: resolution.organization,
      resolution,
      canonicalHostname,
      canonicalOrigin,
      canonicalUrl,
    };
  }, [resolution]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (resolution.kind !== 'redirect') {
      return;
    }

    const targetUrl = `${value.canonicalOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (window.location.href !== targetUrl) {
      window.location.replace(targetUrl);
    }
  }, [resolution.kind, value.canonicalOrigin]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const { organization } = value;
    document.title = organization.title;
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';

    const iconLink = ensureHeadLink('link[rel="icon"]', { rel: 'icon', type: 'image/png' });
    iconLink.href = organization.assets.favicon;
    const iconMimeType = getAssetMimeType(organization.assets.favicon);
    if (iconMimeType) {
      iconLink.type = iconMimeType;
    } else {
      iconLink.removeAttribute('type');
    }
    ensureHeadLink('link[rel="apple-touch-icon"]', { rel: 'apple-touch-icon' }).href =
      organization.assets.appleTouchIcon;
    ensureHeadLink('link[rel="manifest"]', { rel: 'manifest' }).href =
      organization.assets.manifest;

    ensureHeadMeta('meta[name="theme-color"]', { name: 'theme-color' }).content =
      organization.theme.light.browserThemeColor;
    ensureHeadMeta('meta[name="application-name"]', { name: 'application-name' }).content =
      organization.pwa.shortName;
    ensureHeadMeta('meta[name="apple-mobile-web-app-title"]', {
      name: 'apple-mobile-web-app-title',
    }).content = organization.pwa.shortName;
    ensureHeadMeta('meta[name="description"]', { name: 'description' }).content =
      organization.description;
  }, [value]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }

  return context;
};
