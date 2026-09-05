// --- SUPORTE A WEB PUSH NOTIFICATIONS COM ABA FECHADA ---
self.addEventListener('push', function(event) {
  // Ignorar disparos se o Service Worker não estiver rodando no subdomínio correto
  if (self.location.origin === 'https://agilizapro.net' || self.location.origin === 'https://www.agilizapro.net') {
    return;
  }
  
  if (!event.data) return;
  
  let data = { title: 'AgilizaPro', body: 'Você tem uma nova notificação!', url: 'https://app.agilizapro.net/chat' };
  try {
    data = event.data.json();
  } catch (e) {
    data.body = event.data.text();
  }

  let targetUrl = data.url || 'https://app.agilizapro.net/chat';
  if (targetUrl.startsWith('/')) {
    targetUrl = 'https://app.agilizapro.net' + targetUrl;
  }
  if (targetUrl === 'https://agilizapro.net' || targetUrl === 'https://agilizapro.net/' || targetUrl === '/') {
    targetUrl = 'https://app.agilizapro.net/chat';
  }

  const options = {
    body: data.body || data.message || 'Você recebeu uma notificação do AgilizaPro.',
    icon: '/agilizapro_logo_rounded.png',
    badge: '/agilizapro_logo_rounded.png',
    vibrate: [100, 50, 100],
    tag: 'chat', // Use same tag to prevent duplicates if React also fires
    data: {
      url: targetUrl
    }
  };

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      let isVisible = false;
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].visibilityState === 'visible' || clientList[i].focused) {
          isVisible = true;
          break;
        }
      }
      
      // Se o app estiver aberto na tela, não exibe notificação push do sistema.
      if (isVisible) {
        return;
      }
      
      return self.registration.showNotification(data.title || 'AgilizaPro', options);
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  let urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : 'https://app.agilizapro.net/chat';
  if (urlToOpen.startsWith('/')) {
    urlToOpen = 'https://app.agilizapro.net' + urlToOpen;
  }
  if (urlToOpen === 'https://agilizapro.net' || urlToOpen === 'https://agilizapro.net/' || urlToOpen === '/') {
    urlToOpen = 'https://app.agilizapro.net/chat';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
