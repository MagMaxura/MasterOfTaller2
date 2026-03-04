
import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { VAPID_PUBLIC_KEY } from '../../constants';
import { urlBase64ToUint8Array } from '../../utils/pushUtils';
import { BellIcon, BellOffIcon } from '../Icons';

const NotificationSubscriber: React.FC = () => {
    const { currentUser, savePushSubscription } = useData();
    const { showToast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                setSwRegistration(registration);
                registration.pushManager.getSubscription().then(subscription => {
                    setIsSubscribed(!!subscription);
                });
            });
        }
    }, []);

    const handleSubscribe = async () => {
        if (!swRegistration) {
            showToast('El Service Worker no está listo.', 'error');
            return;
        }

        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                showToast('Permiso de notificaciones denegado.', 'error');
                setLoading(false);
                return;
            }

            const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey as any
            });

            if (currentUser) {
                await savePushSubscription(currentUser.id, subscription);
                setIsSubscribed(true);
                showToast('Notificaciones activadas con éxito.', 'success');
            }
        } catch (error) {
            console.error('Error al suscribirse:', error);
            showToast('Error al activar notificaciones.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        if (!swRegistration) return;

        setLoading(true);
        try {
            const subscription = await swRegistration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                if (currentUser) {
                    // @ts-ignore - Limpiamos la suscripción en la DB
                    await savePushSubscription(currentUser.id, null);
                }
                setIsSubscribed(false);
                showToast('Notificaciones desactivadas.', 'info');
            }
        } catch (error) {
            console.error('Error al dessuscribirse:', error);
            showToast('Error al desactivar notificaciones.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return null; // El navegador no soporta push
    }

    return (
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isSubscribed ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-blue/20 text-brand-blue'}`}>
                        {isSubscribed ? <BellIcon className="w-5 h-5" /> : <BellOffIcon className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Notificaciones Móviles</h4>
                        <p className="text-xs text-slate-400">Recibe alertas de asistencia en tu celular</p>
                    </div>
                </div>

                <button
                    onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                    disabled={loading}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isSubscribed
                        ? 'bg-white/5 text-slate-400 hover:bg-brand-red/10 hover:text-brand-red'
                        : 'bg-brand-blue text-white shadow-lg hover:shadow-brand-blue/30 scale-100 hover:scale-105 active:scale-95'
                        } disabled:opacity-50 disabled:scale-100`}
                >
                    {loading ? 'Procesando...' : (isSubscribed ? 'Desactivar' : 'Activar')}
                </button>
            </div>
        </div>
    );
};

export default NotificationSubscriber;
