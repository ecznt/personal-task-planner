self.addEventListener('push', (event) => {
  let title = 'Hatırlatma';
  let body = '';
  let url = '/app/today';

  if (event.data) {
    try {
      const message = JSON.parse(event.data.text());
      if (typeof message.title === 'string' && message.title.length > 0) {
        title = message.title;
      }
      if (typeof message.body === 'string') {
        body = message.body;
      }
      if (typeof message.url === 'string' && message.url.startsWith('/')) {
        url = message.url;
      }
    } catch {
      // Ignore malformed payloads and fall back to defaults.
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      tag: `reminder:${url}`,
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const target = new URL(event.notification.data?.url ?? '/app/today', self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const windowClient of windowClients) {
          if ('focus' in windowClient && windowClient.visibilityState === 'visible') {
            windowClient.navigate(target);
            return windowClient.focus();
          }
        }
        return clients.openWindow(target);
      }),
  );
});