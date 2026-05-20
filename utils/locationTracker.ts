import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '../config';

let watchId: string | null = null;

export async function requestLocationPermission(): Promise<'granted' | 'denied'> {
  if (Capacitor.isNativePlatform()) {
    const status = await Geolocation.requestPermissions();
    return status.location === 'granted' ? 'granted' : 'denied';
  }
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      () => resolve('denied'),
      { timeout: 8000 }
    );
  });
}

export async function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (Capacitor.isNativePlatform()) {
    const status = await Geolocation.checkPermissions();
    if (status.location === 'granted') return 'granted';
    if (status.location === 'denied') return 'denied';
    return 'prompt';
  }
  if ('permissions' in navigator) {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state as 'granted' | 'denied' | 'prompt';
  }
  return 'prompt';
}

export async function startLocationTracking(userId: string): Promise<void> {
  if (watchId) return; // already running

  const upsertLocation = async (lat: number, lng: number, accuracy: number) => {
    await supabase.from('technician_locations').upsert({
      user_id: userId,
      lat,
      lng,
      accuracy_m: accuracy,
      is_online: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  };

  if (Capacitor.isNativePlatform()) {
    watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 15000 },
      (pos, err) => {
        if (err || !pos) return;
        upsertLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      }
    );
  } else {
    const id = navigator.geolocation.watchPosition(
      pos => upsertLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      err => console.warn('Location error:', err.message),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );
    watchId = String(id);
  }
}

export async function stopLocationTracking(userId: string): Promise<void> {
  if (!watchId) return;
  if (Capacitor.isNativePlatform()) {
    await Geolocation.clearWatch({ id: watchId });
  } else {
    navigator.geolocation.clearWatch(Number(watchId));
  }
  watchId = null;
  // Mark as offline
  await supabase.from('technician_locations').upsert(
    { user_id: userId, is_online: false, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
}
