self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Il Cencio';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.url || '/',
      houseId: data.houseId,
      swapId: data.swapId,
      apiBase: data.apiBase || '',
    },
  };
  // I bottoni azione sulla notifica non sono supportati da Safari iOS:
  // li' la notifica resta comunque cliccabile per aprire l'app.
  if (data.actionable && data.swapId) {
    options.actions = [
      { action: 'accept', title: '✓ Accetta' },
      { action: 'decline', title: '✕ Rifiuta' },
    ];
  }
  event.waitUntil(self.registration.showNotification(title, options));
});

async function notifyClients(message) {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clientList.forEach(c => c.postMessage(message));
}

self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  const data = notification.data || {};
  notification.close();

  if ((action === 'accept' || action === 'decline') && data.swapId) {
    event.waitUntil(
      fetch(`${data.apiBase}/api/houses/${data.houseId}/swaps/${data.swapId}/${action}`, { method: 'POST' })
        .then(res => {
          if (!res.ok) throw new Error('Richiesta fallita');
          return self.registration.showNotification(
            action === 'accept' ? 'Scambio accettato ✅' : 'Scambio rifiutato',
            { icon: '/icon-192.png', badge: '/icon-192.png' }
          );
        })
        .then(() => notifyClients({ type: 'swaps-updated' }))
        .catch(() => self.registration.showNotification('Non riuscito, riprova dall\'app', {
          icon: '/icon-192.png', badge: '/icon-192.png',
        }))
    );
    return;
  }

  const url = data.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.postMessage({ type: 'push-open-swap', swapId: data.swapId });
        return existing.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
