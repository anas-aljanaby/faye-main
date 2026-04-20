# Organization Subdomains

This app now supports organization-aware branding by hostname, starting with OTED.

## Current Live Organization

- Organization name: `OTED`
- Database organization id: `e00a73e8-2a0f-413a-93ab-7977fcbd86c5`
- Canonical subdomain: `oted.yetim.app`
- Apex behavior: `yetim.app` redirects to the OTED subdomain in the app shell

## What Is Configured

- Hostname resolution lives in [config/organizations.ts](/Users/anas/Workspace/github/faye-main/config/organizations.ts)
- Runtime org context lives in [contexts/OrganizationContext.tsx](/Users/anas/Workspace/github/faye-main/contexts/OrganizationContext.tsx)
- Theme application lives in [contexts/ThemeContext.tsx](/Users/anas/Workspace/github/faye-main/contexts/ThemeContext.tsx)
- OTED assets live in [public/orgs/oted](/Users/anas/Workspace/github/faye-main/public/orgs/oted)

For OTED we currently apply:

- Custom logo
- Custom favicon and PWA icons
- Custom page title and app metadata
- Custom color palette
- Host-based access guard so users from another organization cannot use the OTED hostname

## Hostname Rules

- `oted.yetim.app` loads the OTED-branded app
- `yetim.app` and `www.yetim.app` redirect to OTED for now
- `localhost` and preview-style non-`yetim.app` hosts fall back to OTED so development still works
- Unknown `*.yetim.app` subdomains are blocked with a setup message instead of silently falling back

## Vercel Setup

Keep all of these on the same Vercel project:

- `yetim.app`
- `*.yetim.app`

Notes:

- Wildcard domains on Vercel require Vercel nameservers
- Once the wildcard is active, new org subdomains like `neworg.yetim.app` do not need a separate Vercel project
- Our code decides which organization to show based on `window.location.hostname`

Recommended checks after Vercel domain setup:

1. Confirm `yetim.app` is verified in the Vercel project.
2. Confirm `*.yetim.app` is verified in the same project.
3. Open `https://oted.yetim.app` and verify OTED branding appears on the sign-in page.
4. Open `https://yetim.app` and verify it redirects to `https://oted.yetim.app`.
5. Sign in with an OTED user and verify the app shell keeps OTED branding.

## How To Add Another Organization Later

1. Create the organization record in Supabase and note its `organizations.id`.
2. Pick a slug, for example `acme`, which will map to `acme.yetim.app`.
3. Add branded assets in `public/orgs/<slug>/`:
   - `logo.<ext>`
   - `favicon.<ext>`
   - `apple-touch-icon.<ext>`
   - `icon-192.<ext>`
   - `icon-512.<ext>`
   - `maskable-icon.<ext>`
   - `manifest.webmanifest`
4. Add a new organization entry in [config/organizations.ts](/Users/anas/Workspace/github/faye-main/config/organizations.ts):
   - `id`
   - `slug`
   - `name`
   - `title`
   - `subtitle`
   - `description`
   - `hostnames`
   - `assets`
   - `pwa`
   - `theme`
5. If the org should use the wildcard subdomain only, no extra Vercel project is required.
6. If the org should also use a custom domain, add that hostname to `hostnames` and attach the domain to the same Vercel project.
7. Build and test before release:
   - `npm run build`
   - open the org hostname
   - verify the title, logo, colors, favicon, and PWA manifest
   - verify a user from another organization is blocked on the wrong hostname

## OTED Asset Replacement

The OTED assets committed now are starter assets so the multitenant path is complete end to end.

When the final OTED brand files are ready:

1. Replace the OTED brand assets inside [public/orgs/oted](/Users/anas/Workspace/github/faye-main/public/orgs/oted).
2. Update the OTED palette inside [config/organizations.ts](/Users/anas/Workspace/github/faye-main/config/organizations.ts).
3. Run `npm run build`.
4. Redeploy.

## Implementation Notes

- The organization is resolved on the client, so one static Vite build can serve multiple branded subdomains.
- Browser metadata is updated at runtime by `OrganizationProvider`.
- PWA notification icons default by hostname in the service worker.
- Brand color overrides are locked for OTED so the org identity stays consistent across the OTED subdomain.
