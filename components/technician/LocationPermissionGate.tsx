import React, { useState } from 'react';
import { MapPinIcon } from '../Icons';
import { requestLocationPermission } from '../../utils/locationTracker';

interface LocationPermissionGateProps {
  onGranted: () => void;
}

const LocationPermissionGate: React.FC<LocationPermissionGateProps> = ({ onGranted }) => {
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleRequest = async () => {
    setRequesting(true);
    const result = await requestLocationPermission();
    setRequesting(false);
    if (result === 'granted') {
      onGranted();
    } else {
      setDenied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 rounded-3xl bg-brand-blue/20 flex items-center justify-center mb-6">
        <MapPinIcon className="w-12 h-12 text-brand-blue" />
      </div>

      <h1 className="text-2xl font-black text-white mb-3 leading-tight">
        Ubicación requerida
      </h1>
      <p className="text-slate-400 text-sm font-semibold max-w-xs mb-2">
        Para usar la aplicación necesitamos que compartas tu ubicación en tiempo real.
      </p>
      <p className="text-slate-500 text-xs max-w-xs mb-10">
        Tu posición se comparte únicamente con los administradores de la empresa durante tu jornada laboral.
      </p>

      {denied ? (
        <div className="space-y-4 w-full max-w-xs">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <p className="text-red-400 text-sm font-bold">
              Permiso denegado. Por favor, habilitá la ubicación desde la configuración de tu dispositivo y recargá la app.
            </p>
          </div>
          <button
            onClick={() => { setDenied(false); handleRequest(); }}
            className="w-full py-4 rounded-2xl bg-brand-blue text-white font-black text-sm uppercase tracking-widest"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <button
          onClick={handleRequest}
          disabled={requesting}
          className="w-full max-w-xs py-4 rounded-2xl bg-brand-blue text-white font-black text-sm uppercase tracking-widest disabled:opacity-60 transition-all active:scale-95"
        >
          {requesting ? 'Solicitando permiso...' : 'Habilitar ubicación'}
        </button>
      )}
    </div>
  );
};

export default LocationPermissionGate;
