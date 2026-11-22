/// <reference lib="webworker" />
// Service worker: funciona sin conexión (precache) y muestra las notificaciones push.
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (string | { url: string; revision: string | null })[] };

precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string; url?: string; tag?: string; buzz?: boolean } = {};
  try { data = event.data?.json() ?? {}; } catch { data = { body: event.data?.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Plancito', {
    body: data.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.tag,
    data: { url: data.url || '/' },
    // El zumbido vibra fuerte, como en el MSN (en Android).
    ...(data.buzz ? { vibrate: [220, 90, 220, 90, 420], renotify: true } : {}),
  } as NotificationOptions));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) { await (c as WindowClient).navigate(url).catch(() => undefined); return (c as WindowClient).focus(); } }
    return self.clients.openWindow(url);
  })());
});
