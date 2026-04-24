export interface GeoSnapshot {
  lat: number;
  lng: number;
  accuracy: number | null;
  capturedAt: string;
}

export const getCurrentGeoSnapshot = (options?: PositionOptions): Promise<GeoSnapshot> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalizacion no disponible en este dispositivo.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
          capturedAt: new Date().toISOString()
        });
      },
      error => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('Debes habilitar la ubicacion para operar misiones.'));
          return;
        }
        reject(new Error(`No se pudo capturar ubicacion: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
        ...options
      }
    );
  });
};
