# Minimum PWA Plan (Read-Only + Friendly Offline UX)

## Goal
Ship the smallest safe PWA upgrade for this repo: installable app shell, basic offline awareness, and clear internet-required messaging without building a complex offline data system.

## What We Will Build
- Installable PWA foundation (manifest + icons + service worker registration).
- Cached app shell so returning users can open the app shell offline.
- Friendly offline messaging instead of broken loaders or silent failures.
- Optional: dashboard read-only offline snapshot if it was loaded previously.

## What We Will Not Build (Now)
- Offline writes, mutation queues, conflict resolution.
- Background sync and push notifications.
- Broad offline support across all screens.
- Deep data persistence migration unless needed for dashboard-only snapshot.

## Repo-Specific Decisions
- Keep hash routing and set `start_url` to `/#/`.
- Do not service-worker-cache Supabase authenticated API endpoints.
- Prefer graceful "internet required" UX over aggressive caching for secure data.
- Limit offline data behavior to dashboard first (if cached), then iterate later.

## Implementation Steps

### 1) PWA Foundation
- Update [vite.config.ts](/Users/anas/Workspace/github/faye-main/vite.config.ts):
  - Add `vite-plugin-pwa` using `generateSW`.
  - Use `registerType: "prompt"` and `cleanupOutdatedCaches: true`.
  - Keep `navigateFallback: "/index.html"` for SPA shell behavior.
- Add [public/manifest.webmanifest](/Users/anas/Workspace/github/faye-main/public/manifest.webmanifest):
  - `display: "standalone"`, `orientation: "portrait"`, `start_url: "/#/"`, `scope: "/"`.
  - Arabic app metadata and theme colors.
- Update [index.html](/Users/anas/Workspace/github/faye-main/index.html):
  - Remove `/vite.svg` favicon reference.
  - Add manifest link, theme-color, iOS app-capable meta tags, and proper app icons.
- Add icon assets in [public/icons](/Users/anas/Workspace/github/faye-main/public/icons) (`192`, `512`, maskable, apple-touch, favicon).

### 2) Safe Caching Policy
- Cache only shell/static same-origin assets via Workbox.
- Optionally cache safe public images only.
- Explicitly exclude Supabase auth/rest/functions/realtime endpoints from SW runtime caching.
- Add update prompt UX (new version available -> refresh action).

### 3) Minimal Offline UX
- Add `useNetworkStatus` hook and a global offline banner in [App.tsx](/Users/anas/Workspace/github/faye-main/App.tsx) or [components/Header.tsx](/Users/anas/Workspace/github/faye-main/components/Header.tsx).
- Add a reusable "internet required" state component for screens that cannot function offline.
- Standardize API error handling to show:
  - offline-specific message when disconnected
  - generic retry message for server/network errors

### 4) Dashboard-Only Offline Read (Optional MVP+)
- Keep existing React Query persistence in [index.tsx](/Users/anas/Workspace/github/faye-main/index.tsx) for now.
- Ensure dashboard query keys are persisted and hydrate correctly on reload.
- In [components/Dashboard.tsx](/Users/anas/Workspace/github/faye-main/components/Dashboard.tsx):
  - render cached read-only data when offline and available
  - otherwise show friendly offline empty state ("Connect to internet to load latest dashboard data")
- No offline write support on dashboard actions.

### 5) Guard Mutations While Offline
- For critical create/update/delete flows, short-circuit when offline and show clear localized message.
- Do not attempt mutation retries in offline mode in this phase.

### 6) Validation and Release Checks
- Verify installability on Android Chrome and iOS Safari add-to-home workflow.
- Verify shell opens offline after one successful online load.
- Verify dashboard offline behavior (cached vs not-cached states).
- Verify update prompt appears after new deploy.
- Run Lighthouse PWA audit and fix only blockers for installability/offline shell.

## Definition of Done (Minimum)
- App is installable with proper icons and standalone launch.
- Service worker caches shell/static assets safely.
- Supabase authenticated endpoints are not cached by service worker.
- User sees clear offline banner and friendly internet-required messages.
- Dashboard can show previously loaded read-only data offline (or explicit offline empty state).
- Offline writes are blocked with a clear message.

## Next Iteration (If Needed)
- Migrate React Query persistence to IndexedDB for larger offline footprint.
- Expand offline read support to orphan/sponsor detail views.
- Consider queued writes only after strict conflict and security design.
