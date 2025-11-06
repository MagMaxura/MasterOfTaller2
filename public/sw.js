/*
 * Service Worker for Push Notifications
 */

// ATENCIÓN: La URL del ícono depende de la configuración en constants.tsx. 
// Si las notificaciones no muestran el ícono, verifica la SUPABASE_URL allí.
const ICON_URL = 'https://npoukowwhminfidgkriq.supabase.co/storage/v1/object/public/iconos-equipamiento/cazco.png';

// Escucha eventos push del servidor.
self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  // Intenta parsear los datos recibidos como JSON.
  let notificationData = {
    title: 'Nueva Notificación',
    body: 'Tienes una nueva actualización.',
    icon: ICON_URL
  };
  try {
    const data = event.data.json();
    notificationData.title = data.title || notificationData.title;
    notificationData.body = data.body || notificationData.body;
    notificationData.icon = data.icon || notificationData.icon;
  } catch (e) {
    // Si los datos no son JSON, los muestra como texto plano.
    notificationData.body = event.data.text();
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: ICON_URL,
    vibrate: [200, 100, 200], // Patrón de vibración
    tag: 'new-mission-notification', // Agrupa notificaciones
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(notificationData.title, options));
});

// Escucha clics en la notificación.
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('/') // Abre la aplicación al hacer clic.
  );
});
