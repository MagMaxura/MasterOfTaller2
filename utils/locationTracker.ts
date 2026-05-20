import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '../config';

// --- Throttle config ---
// GPS fires every ~1-3s. We only write to DB when:
//   1. At least MIN_INTERVAL_MS has passed since the last write, AND
//   2. The device has moved at least MIN_DISTANCE_M meters (or it's the first fix).
// Result: ~4 writes/min while moving, ~0 writes/min while still.
const MIN_INTERVAL_MS = 15_000;  // 15 seconds
const MIN_DISTANCE_M  = 10;      // 10 metres

let watchId: string | null = null;
let lastWriteTime = 0;
let lastLat = 0;
let lastLng = 0;

// Haversine distance in metres between two lat/lng pairs
function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  if (watchId) return;

  // Reset throttle state for this session
  lastWriteTime = 0;
  lastLat = 0;
  lastLng = 0;

  const maybeWrite = async (lat: number, lng: number, accuracy: number) => {
    const now = Date.now();
    const movedM = distanceMetres(lastLat, lastLng, lat, lng);
    const elapsedMs = now - lastWriteTime;

    // Skip write: not enough time AND not enough movement
    if (lastWriteTime > 0 && elapsedMs < MIN_INTERVAL_MS && movedM < MIN_DISTANCE_M) return;

    lastWriteTime = now;
    lastLat = lat;
    lastLng = lng;

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
        maybeWrite(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      }
    );
  } else {
    const id = navigator.geolocation.watchPosition(
      pos => maybeWrite(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
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
