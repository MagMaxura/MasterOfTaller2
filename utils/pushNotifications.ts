/**
 * Este archivo contiene la lógica para suscribir a un usuario a notificaciones push.
 */
import { VAPID_PUBLIC_KEY } from '../constants';

// La VAPID_PUBLIC_KEY ahora se importa desde el archivo central de constantes,
// eliminando la necesidad de sincronizarla manualmente con el backend.

/**
 * Convierte una cadena base64 URL-safe a un Uint8Array.
 * Esto es necesario para la clave de la aplicación en la suscripción push.
 * @param {string} base64String
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Revisa el estado del permiso y suscribe al usuario a notificaciones push si es posible.
 * Devuelve la suscripción si es exitosa, o null si falla o no es soportado.
 * @returns {Promise<PushSubscription | null>}
 */
export const subscribeUserToPush = async (): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('User is already subscribed.', subscription);
      return subscription;
    }

    if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Push notification permission was not granted.');
            return null;
        }
    }

    console.log('Subscribing new user...');
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log('New push subscription created:', subscription);
    return subscription;

  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};
