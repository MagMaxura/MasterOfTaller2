import React, { useCallback, useEffect, useState } from 'react';
import { Role, User } from '../../types';
import { getCurrentGeoSnapshot } from '../../utils/geo';

const LocationRequiredModal: React.FC<{
  state: PermissionState | 'unsupported';
  onRequest: () => void;
  isLoading: boolean;
}> = ({ state, onRequest, isLoading }) => {
  const blocked = state === 'denied';

  return (
    <div className="fixed inset-0 bg-brand-primary z-[100] flex items-center justify-center p-6 animate-fade-in overflow-y-auto">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2m0 18l6-3m-6 3V2m6 15l6 3m0 0V7m0 13V7m0 0l-6-3m6 3l-6 3m0 0l-6-3" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">Ubicacion Obligatoria</h2>
          <p className="text-slate-400 mt-3 text-sm">
            Para el rol tecnico, la ubicacion es obligatoria por politica interna. Sin este permiso no puedes operar misiones.
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${state === 'granted' ? 'bg-brand-green/10 border-brand-green/30' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Permiso de ubicacion</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Seguimiento de misiones tecnico</p>
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${state === 'granted' ? 'bg-brand-green/20 text-brand-green' : blocked ? 'bg-brand-red/20 text-brand-red' : 'bg-brand-orange/20 text-brand-orange'}`}>
              {state === 'granted' ? 'Activo' : blocked ? 'Bloqueado' : state === 'unsupported' ? 'No soportado' : 'Pendiente'}
            </span>
          </div>
        </div>

        {blocked ? (
          <div className="space-y-3">
            <p className="text-[11px] text-brand-red font-bold text-center">
              Debes habilitar la ubicacion desde la configuracion del navegador y recargar.
            </p>
            <button onClick={() => window.location.reload()} className="w-full bg-brand-red text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg">
              Reintentar
            </button>
          </div>
        ) : (
          <button
            onClick={onRequest}
            disabled={isLoading}
            className="w-full bg-brand-blue hover:bg-brand-highlight text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span className="uppercase tracking-widest text-xs">Habilitar Ubicacion</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const PermissionsGuard: React.FC<{ user: User; children: React.ReactNode }> = ({ user, children }) => {
  const [locationState, setLocationState] = useState<PermissionState | 'unsupported'>('prompt');
  const [isLoading, setIsLoading] = useState(false);
  const isTechnician = user.role === Role.TECHNICIAN;

  const checkLocationPermission = useCallback(async () => {
    if (!isTechnician) return;
    if (!navigator.geolocation) {
      setLocationState('unsupported');
      return;
    }

    try {
      if (navigator.permissions) {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        setLocationState(status.state);
        return;
      }
    } catch (_e) {
      // Fallback below
    }

    try {
      await getCurrentGeoSnapshot({ timeout: 4000, maximumAge: 60000 });
      setLocationState('granted');
    } catch {
      setLocationState('prompt');
    }
  }, [isTechnician]);

  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  const requestLocationPermission = async () => {
    setIsLoading(true);
    try {
      await getCurrentGeoSnapshot({ timeout: 10000, maximumAge: 0 });
      setLocationState('granted');
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('habilitar')) {
        setLocationState('denied');
      } else {
        setLocationState('prompt');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isTechnician && locationState !== 'granted') {
    return <LocationRequiredModal state={locationState} onRequest={requestLocationPermission} isLoading={isLoading} />;
  }

  return <>{children}</>;
};

export default PermissionsGuard;
