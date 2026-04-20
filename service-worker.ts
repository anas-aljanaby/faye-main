/// <reference lib="webworker" />

import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';
import { createHandlerBoundToURL, precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { resolveOrganizationForHostname } from './config/organizations';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<unknown>;
};

type PushPayload = {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    actionUrl?: string;
    notificationId?: string;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    metadata?: Record<string, unknown>;
  };
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
clientsClaim();

const navigationHandler = createHandlerBoundToURL('/index.html');
registerRoute(new NavigationRoute(navigationHandler));

registerRoute(
  /^https:\/\/.*\.supabase\.co\/.*/i,
  new NetworkOnly()
);

registerRoute(
  ({ request, url }) => request.destination === 'image' && url.origin === self.location.origin,
  new StaleWhileRevalidate({
    cacheName: 'local-images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

const toAppUrl = (actionUrl?: string) => {
  const path = actionUrl && actionUrl.startsWith('/') ? actionUrl : '/';
  return new URL(`/#${path}`, self.location.origin).toString();
};

self.addEventListener('push', (event) => {
  const payload = event.data?.json() as PushPayload | undefined;
  const organization = resolveOrganizationForHostname(self.location.hostname).organization;
  const title = payload?.title ?? 'يتيم';
  const body = payload?.body ?? 'لديك إشعار جديد.';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: payload?.icon ?? organization.assets.icon192,
      badge: payload?.badge ?? organization.assets.favicon,
      tag: payload?.tag,
      data: payload?.data ?? { actionUrl: '/' },
      dir: 'rtl',
      lang: 'ar',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = (event.notification.data ?? {}) as PushPayload['data'];
  const targetUrl = toAppUrl(notificationData?.actionUrl);

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      for (const client of clientList) {
        if ('navigate' in client) {
          const windowClient = client as WindowClient;
          await windowClient.navigate(targetUrl);
          await windowClient.focus();
          return;
        }
      }

      await self.clients.openWindow(targetUrl);
    })()
  );
});
