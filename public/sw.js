/**
 * Archivo: sw.js
 * Ruta: public/sw.js
 * Última modificación: 2026-03-09
 * Descripción: Service Worker para push notifications.
 *   - Recibe eventos push del servidor
 *   - Muestra notificaciones nativas
 *   - Maneja clicks en notificaciones
 */

// Versión del SW para cache busting
const SW_VERSION = '1.0.0';

// Evento de instalación
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v' + SW_VERSION);
  self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado');
  event.waitUntil(clients.claim());
});

// Evento push - recibe notificación del servidor
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);

  let data = {
    title: 'Woditos',
    body: 'Tienes una nueva notificación',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'woditos-notification',
    data: { url: '/' },
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: {
          url: payload.action_url || payload.url || '/',
          ...payload.data,
        },
      };
    }
  } catch (err) {
    console.error('[SW] Error parsing push data:', err);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta, enfocarla y navegar
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Si no, abrir una nueva ventana
      return clients.openWindow(url);
    })
  );
});

// Cerrar notificación
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificación cerrada');
});
