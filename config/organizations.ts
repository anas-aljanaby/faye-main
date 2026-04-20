export type ColorMode = 'light' | 'dark';

export interface OrganizationThemePalette {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  pageBackground: string;
  sidebarBackground: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  browserThemeColor: string;
}

export interface OrganizationTheme {
  light: OrganizationThemePalette;
  dark: OrganizationThemePalette;
}

export interface OrganizationAssets {
  logo: string;
  favicon: string;
  appleTouchIcon: string;
  icon192: string;
  icon512: string;
  maskableIcon: string;
  manifest: string;
}

export interface OrganizationPwaConfig {
  name: string;
  shortName: string;
  description: string;
}

export interface OrganizationConfig {
  id: string;
  slug: string;
  name: string;
  title: string;
  productName: string;
  subtitle: string;
  description: string;
  hostnames: string[];
  allowUserThemeColorOverride?: boolean;
  assets: OrganizationAssets;
  pwa: OrganizationPwaConfig;
  theme: OrganizationTheme;
}

export type OrganizationResolutionKind =
  | 'matched'
  | 'fallback'
  | 'redirect'
  | 'unknown-subdomain';

export interface OrganizationResolution {
  kind: OrganizationResolutionKind;
  hostname: string;
  canonicalHostname: string;
  organization: OrganizationConfig;
  requestedSlug?: string;
}

export const APP_BASE_DOMAIN = 'yetim.app';

const OTED_ORGANIZATION: OrganizationConfig = {
  id: 'e00a73e8-2a0f-413a-93ab-7977fcbd86c5',
  slug: 'oted',
  name: 'OTED',
  title: 'OTED | Yetim',
  productName: 'منصة يتيم',
  subtitle: 'واجهة OTED على منصة يتيم لإدارة رعاية الأيتام.',
  description: 'واجهة OTED المخصّصة على منصة يتيم لإدارة رعاية الأيتام والكفلاء والمدفوعات.',
  hostnames: ['oted.yetim.app'],
  allowUserThemeColorOverride: false,
  assets: {
    logo: '/orgs/oted/logo-arabic.webp',
    favicon: '/orgs/oted/favicon.png',
    appleTouchIcon: '/orgs/oted/apple-touch-icon.png',
    icon192: '/orgs/oted/icon-192.png',
    icon512: '/orgs/oted/icon-512.png',
    maskableIcon: '/orgs/oted/maskable-icon.png',
    manifest: '/orgs/oted/manifest.webmanifest',
  },
  pwa: {
    name: 'OTED - Yetim',
    shortName: 'OTED',
    description: 'نسخة OTED من منصة يتيم لإدارة رعاية الأيتام والكفلاء والمدفوعات.',
  },
  theme: {
    light: {
      primary: '#059669',
      primaryHover: '#047857',
      primaryLight: '#d1fae5',
      pageBackground: '#f3fbf7',
      sidebarBackground: '#ecf8f1',
      cardBackground: '#ffffff',
      textPrimary: '#163227',
      textSecondary: '#5f746a',
      browserThemeColor: '#059669',
    },
    dark: {
      primary: '#34d399',
      primaryHover: '#6ee7b7',
      primaryLight: '#064e3b',
      pageBackground: '#071b13',
      sidebarBackground: '#0c241a',
      cardBackground: '#112a20',
      textPrimary: '#f2fffa',
      textSecondary: '#99b8aa',
      browserThemeColor: '#0c241a',
    },
  },
};

export const ORGANIZATIONS: OrganizationConfig[] = [OTED_ORGANIZATION];
export const DEFAULT_ORGANIZATION = OTED_ORGANIZATION;

const EXACT_FALLBACK_HOSTS = new Set(['localhost', '127.0.0.1']);
const ROOT_DOMAIN_HOSTS = new Set([APP_BASE_DOMAIN, `www.${APP_BASE_DOMAIN}`]);

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/:\d+$/, '');
}

export function getOrganizationById(id: string): OrganizationConfig | null {
  return ORGANIZATIONS.find((organization) => organization.id === id) ?? null;
}

export function getOrganizationBySlug(slug: string): OrganizationConfig | null {
  return ORGANIZATIONS.find((organization) => organization.slug === slug) ?? null;
}

export function getCanonicalHostname(organization: OrganizationConfig): string {
  return organization.hostnames[0] ?? `${organization.slug}.${APP_BASE_DOMAIN}`;
}

export function buildOrganizationOrigin(organization: OrganizationConfig): string {
  return `https://${getCanonicalHostname(organization)}`;
}

export function buildOrganizationAppUrl(
  organization: OrganizationConfig,
  hashPath = '/'
): string {
  const normalizedPath = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  return `${buildOrganizationOrigin(organization)}/#${normalizedPath}`;
}

export function resolveOrganizationForHostname(rawHostname: string): OrganizationResolution {
  const hostname = normalizeHostname(rawHostname);

  if (EXACT_FALLBACK_HOSTS.has(hostname)) {
    return {
      kind: 'fallback',
      hostname,
      organization: DEFAULT_ORGANIZATION,
      canonicalHostname: getCanonicalHostname(DEFAULT_ORGANIZATION),
    };
  }

  const exactMatch =
    ORGANIZATIONS.find((organization) =>
      organization.hostnames.some((candidateHostname) => normalizeHostname(candidateHostname) === hostname)
    ) ?? null;

  if (exactMatch) {
    return {
      kind: 'matched',
      hostname,
      organization: exactMatch,
      canonicalHostname: getCanonicalHostname(exactMatch),
    };
  }

  if (ROOT_DOMAIN_HOSTS.has(hostname)) {
    return {
      kind: 'redirect',
      hostname,
      organization: DEFAULT_ORGANIZATION,
      canonicalHostname: getCanonicalHostname(DEFAULT_ORGANIZATION),
    };
  }

  const wildcardSuffix = `.${APP_BASE_DOMAIN}`;
  if (hostname.endsWith(wildcardSuffix)) {
    const subdomain = hostname.slice(0, -wildcardSuffix.length);
    const slug = subdomain.split('.').pop() ?? subdomain;
    const matchBySlug = getOrganizationBySlug(slug);

    if (matchBySlug) {
      return {
        kind: 'matched',
        hostname,
        organization: matchBySlug,
        canonicalHostname: getCanonicalHostname(matchBySlug),
      };
    }

    return {
      kind: 'unknown-subdomain',
      hostname,
      organization: DEFAULT_ORGANIZATION,
      canonicalHostname: getCanonicalHostname(DEFAULT_ORGANIZATION),
      requestedSlug: slug,
    };
  }

  return {
    kind: 'fallback',
    hostname,
    organization: DEFAULT_ORGANIZATION,
    canonicalHostname: getCanonicalHostname(DEFAULT_ORGANIZATION),
  };
}
