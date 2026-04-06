import React from 'react';
import { CogIcon, BellIcon, MapPinIcon } from '../../Icons';

const SettingsPanel: React.FC = () => {
  const handleRequestPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        window.location.reload(); // Reload to update UI
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-brand-primary p-6 rounded-[32px] border border-brand-accent shadow-premium space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-brand-highlight/5 flex items-center justify-center text-brand-highlight">
          <CogIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-brand-highlight tracking-tight">Configuración</h3>
          <p className="text-[10px] text-brand-light uppercase font-black tracking-widest opacity-60">Optimización de la App</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Notifications Section */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${Notification.permission === 'granted' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-blue/10 text-brand-blue'}`}>
              <BellIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-brand-highlight">Notificaciones Push</p>
              <p className={`text-[10px] font-black uppercase tracking-tighter ${Notification.permission === 'granted' ? 'text-brand-green' : 'text-brand-blue'}`}>
                {Notification.permission === 'granted' ? 'Activadas' : 'Pendientes'}
              </p>
            </div>
          </div>
          
          {Notification.permission !== 'granted' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Para recibir alertas de misiones y novedades, debes habilitar los permisos:
              </p>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="text-[10px] font-black text-brand-highlight uppercase">Pasos a seguir:</p>
                <ol className="text-[11px] text-slate-600 space-y-1 list-decimal pl-4">
                  <li>Haz clic en el icono del <b>candado 🔒</b> en la barra de direcciones del navegador (arriba a la izquierda).</li>
                  <li>Busca <b>"Notificaciones"</b> y cámbialo a <b>"Permitir"</b>.</li>
                  <li>Recarga la página para aplicar los cambios.</li>
                </ol>
              </div>
              <button 
                onClick={handleRequestPush}
                className="w-full bg-brand-blue text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95"
              >
                Intentar Activar Ahora
              </button>
            </div>
          ) : (
            <p className="text-xs text-brand-green font-medium">¡Todo listo! Recibirás notificaciones en tiempo real.</p>
          )}
        </div>

        {/* Location Section - Optional now but good to show */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 opacity-60">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 text-xs">
            <MapPinIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-500">Ubicación (Opcional)</p>
            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Desactivada</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
