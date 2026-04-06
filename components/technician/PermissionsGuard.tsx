import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { LEVEL_THRESHOLDS } from '../../config';
import { subscribeUserToPush } from '../../utils/pushNotifications';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';

// --- CONDITIONS MODAL ---
const ConditionsModal: React.FC<{
    permissions: { notifications: PermissionState; };
    onRequest: () => void;
    isLoading: boolean;
}> = ({ permissions, onRequest, isLoading }) => {
    const isAnyDenied = permissions.notifications === 'denied';

    return (
        <div className="fixed inset-0 bg-brand-primary z-[100] flex items-center justify-center p-6 animate-fade-in overflow-y-auto">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl space-y-8">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-brand-blue/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Condiciones de Uso</h2>
                    <p className="text-slate-400 font-medium leading-relaxed">
                        Para garantizar el correcto funcionamiento del sistema de gestión y misiones, es <span className="text-brand-blue font-black underline">obligatorio</span> conceder los siguientes permisos:
                    </p>
                </div>

                <div className="space-y-4">
                    <div className={`p-4 rounded-2xl border transition-all ${permissions.notifications === 'granted' ? 'bg-brand-green/10 border-brand-green/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${permissions.notifications === 'granted' ? 'bg-brand-green text-white' : 'bg-white/10 text-slate-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-sm">Notificaciones Push</h4>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Alertas de ingresos</p>
                            </div>
                            {permissions.notifications === 'granted' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : permissions.notifications === 'denied' && (
                                <span className="text-[8px] font-black bg-brand-red/20 text-brand-red px-2 py-1 rounded-md uppercase tracking-tighter">Bloqueado</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    {isAnyDenied ? (
                        <div className="bg-brand-red/10 border border-brand-red/30 p-4 rounded-2xl space-y-3">
                            <p className="text-[11px] font-bold text-brand-red uppercase tracking-wider text-center leading-relaxed">
                                Has bloqueado los permisos. Ve a la configuración de tu navegador y permite las notificaciones para entrar.
                            </p>
                            <button onClick={() => window.location.reload()} className="w-full bg-brand-red text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg">Reiniciar App</button>
                        </div>
                    ) : (
                        <button
                            onClick={onRequest}
                            disabled={isLoading}
                            className="w-full bg-brand-blue hover:bg-brand-highlight text-white font-black py-5 rounded-[24px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-blue/20 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="uppercase tracking-[0.2em] text-xs">Aceptar y Activar</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    )}
                    <p className="text-[9px] text-slate-500 text-center mt-6 font-bold uppercase tracking-widest leading-loose">
                        Al aceptar, confirmas el envío de notificaciones <br /> para fines laborales según el reglamento interno.
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- PERMISSIONS GUARD ---
const PermissionsGuard: React.FC<{ user: User; children: React.ReactNode; }> = ({ user, children }) => {
    const { savePushSubscription, updateUser } = useData();
    const { showToast } = useToast();
    const [permissions, setPermissions] = useState<{
        notifications: PermissionState;
    }>({ notifications: 'prompt' });
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialCheck, setIsInitialCheck] = useState(true);

    const bonusClaimedKey = `permissions_bonus_claimed_${user.id}`;

    const getNotificationState = useCallback(async (): Promise<PermissionState> => {
        try {
            if (!navigator.permissions) throw new Error("Permissions API not supported");
            return (await navigator.permissions.query({ name: 'notifications' })).state;
        } catch (error) {
            console.warn("navigator.permissions.query for notifications failed, using fallback.", error);
            const state = Notification.permission;
            return state === 'default' ? 'prompt' : state;
        }
    }, []);

    const checkPermissions = useCallback(async () => {
        const notifState = await getNotificationState();
        setPermissions({ notifications: notifState });
        if (isInitialCheck) setIsInitialCheck(false);
    }, [getNotificationState, isInitialCheck]);

    useEffect(() => {
        checkPermissions();
        let notifStatus: PermissionStatus;
        const setupListeners = async () => {
            try {
                notifStatus = await navigator.permissions.query({ name: 'notifications' });
                notifStatus.onchange = checkPermissions;
            } catch (e) { console.warn("Could not set up permission listeners", e); }
        }
        setupListeners();
        return () => {
            if (notifStatus) notifStatus.onchange = null;
        }
    }, [checkPermissions]);

    const handleRequestPermissions = async () => {
        setIsLoading(true);
        const wereGrantedBefore = permissions.notifications === 'granted';

        try {
            const notificationPermission = await Notification.requestPermission();
            if (notificationPermission === 'granted') {
                const subscription = await subscribeUserToPush();
                if (subscription) await savePushSubscription(user.id, subscription);
            }
        } catch (error) {
            console.error("Error requesting permissions:", error);
        }

        setTimeout(async () => {
            const newNotifState = await getNotificationState();
            setPermissions({ notifications: newNotifState });
            const areGrantedNow = newNotifState === 'granted';

            if (areGrantedNow && !wereGrantedBefore) {
                const bonusClaimed = localStorage.getItem(bonusClaimedKey);
                if (!bonusClaimed) {
                    try {
                        const bonusXp = 50;
                        const updatedUser = { ...user, xp: user.xp + bonusXp };
                        const nextLevelXp = LEVEL_THRESHOLDS[user.level] || Infinity;
                        if (updatedUser.xp >= nextLevelXp) updatedUser.level += 1;
                        await updateUser(user.id, updatedUser);
                        localStorage.setItem(bonusClaimedKey, 'true');
                        showToast(`¡Bonus reclamado! Has ganado ${bonusXp} XP.`, 'success');
                    } catch (error) {
                        showToast(error instanceof Error ? error.message : "Error al otorgar bonus.", 'error');
                    }
                }
            }
            setIsLoading(false);
        }, 1500);
    };

    const showModal = !isInitialCheck && permissions.notifications !== 'granted';

    if (showModal) {
        return <ConditionsModal permissions={permissions} onRequest={handleRequestPermissions} isLoading={isLoading} />;
    }

    return (
        <>
            {children}
        </>
    );
};

export default PermissionsGuard;