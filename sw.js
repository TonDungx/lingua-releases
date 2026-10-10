'use strict';
// Tombstone for the worker that used to live here.
//
// Until this release the Flutter app *was* the site root, and its service
// worker was registered at `/lingua-releases/` — a scope that also covers the
// `/lingua-releases/app/` the app has now moved into. Left alone that
// registration would outlive the move: it intercepts requests for the new app,
// answers navigations from a cache full of the old build, and holds
// origin-wide cache names the new worker also wants.
//
// A browser refetches the worker script on navigations into its scope, so the
// old registration picks this file up by itself. It does not need to be
// registered by anything, and the landing page deliberately does not: a static
// page of three files has nothing to gain from offline support.
//
// Once every visitor has been through here this file can go. Keeping it costs
// nothing, and deleting it early would leave anyone who has not returned since
// the move stuck with the old worker for good.

const OLD_CACHES = [
  'lingua-content',
  'lingua-temp',
  'lingua-manifest',
  'lingua-runtime',
];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // By name, not `caches.keys()`: cache storage belongs to the whole
      // origin, and the app's own caches (`lingua-lingua-releases-app-*`) are
      // sitting right next to these. A blanket delete would wipe the offline
      // copy of the app this is supposed to be clearing the way for.
      await Promise.all(OLD_CACHES.map((name) => caches.delete(name)));
      await self.registration.unregister();
      // The page that triggered this was served by the old worker before it
      // was replaced, so it is showing the old app shell. Reload it now that
      // nothing is intercepting, and it becomes the landing page.
      const windows = await self.clients.matchAll({ type: 'window' });
      for (const client of windows) {
        if ('navigate' in client) client.navigate(client.url);
      }
    })(),
  );
});

// Deliberately no fetch handler: everything goes straight to the network for
// the one load this worker is alive for.
