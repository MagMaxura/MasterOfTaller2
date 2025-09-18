import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { LEVEL_THRESHOLDS } from '../../config';
import { subscribeUserToPush } from '../../utils/pushNotifications';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';

// --- PERMISSIONS BANNER ---
const PermissionsBanner: React.FC<{
    permissions: { notifications: PermissionState; geolocation: PermissionState; };
    onRequest: () => void;
    isLoading: boolean;
}> = ({ permissions, onRequest, isLoading }) => {
    const isDenied = permissions.notifications === 'denied' || permissions.geolocation === 'denied';

    const message = isDenied
        ? 'Algunos permisos están bloqueados. Habilita la ubicación y notificaciones en la configuración de tu navegador para una experiencia completa.'
        : '¡Activa la ubicación y las notificaciones para una mejor experiencia y gana un bonus de 50 XP!';

    return (
        <div className="bg-brand-orange text-brand-primary p-3 text-center sticky top-16 z-10 shadow-lg">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                <p className="font-semibold flex-grow sm:text-center">{message}</p>
                {!isDenied && (
                    <button onClick={onRequest} disabled={isLoading} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors whitespace-nowrap disabled:bg-opacity-50 disabled:cursor-wait flex items-center gap-2">
                        {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                        {isLoading ? 'Procesando...' : 'Activar y Reclamar'}
                    </button>
                )}
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
        geolocation: PermissionState;
    }>({ notifications: 'prompt', geolocation: 'prompt' });
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

    const getGeolocationState = useCallback(async (): Promise<PermissionState> => {
        try {
            if (!navigator.permissions) throw new Error("Permissions API not supported");
            return (await navigator.permissions.query({ name: 'geolocation' })).state;
        } catch (error) {
            console.warn("navigator.permissions.query for geolocation failed.", error);
            return 'prompt'; 
        }
    }, []);

    const checkPermissions = useCallback(async () => {
        const [notifState, geoState] = await Promise.all([ getNotificationState(), getGeolocationState() ]);
        setPermissions({ notifications: notifState, geolocation: geoState });
        if (isInitialCheck) setIsInitialCheck(false);
    }, [getNotificationState, getGeolocationState, isInitialCheck]); 

    useEffect(() => {
        checkPermissions();
        let notifStatus: PermissionStatus, geoStatus: PermissionStatus;
        const setupListeners = async () => {
             try {
                notifStatus = await navigator.permissions.query({ name: 'notifications' });
                notifStatus.onchange = checkPermissions;
                geoStatus = await navigator.permissions.query({ name: 'geolocation' });
                geoStatus.onchange = checkPermissions;
            } catch(e) { console.warn("Could not set up permission listeners", e); }
        }
        setupListeners();
        return () => {
            if (notifStatus) notifStatus.onchange = null;
            if (geoStatus) geoStatus.onchange = null;
        }
    }, [checkPermissions]);

    const handleRequestPermissions = async () => {
        setIsLoading(true);
        const wereGrantedBefore = permissions.notifications === 'granted' && permissions.geolocation === 'granted';

        try {
            const notificationPermission = await Notification.requestPermission();
            if (notificationPermission === 'granted') {
                const subscription = await subscribeUserToPush();
                if (subscription) await savePushSubscription(user.id, subscription);
            }
            await new Promise<void>((resolve) => {
                navigator.geolocation.getCurrentPosition(() => resolve(), () => resolve(), { timeout: 10000 });
            });
        } catch (error) {
            console.error("Error requesting permissions:", error);
        }
        
        setTimeout(async () => {
            const [newNotifState, newGeoState] = await Promise.all([ getNotificationState(), getGeolocationState() ]);
            setPermissions({ notifications: newNotifState, geolocation: newGeoState });
            const areGrantedNow = newNotifState === 'granted' && newGeoState === 'granted';

            if (areGrantedNow && !wereGrantedBefore) {
                const bonusClaimed = localStorage.getItem(bonusClaimedKey);
                if (!bonusClaimed) {
                    try {
                        const bonusXp = 50;
                        const updatedUser = { ...user, xp: user.xp + bonusXp };
                        const nextLevelXp = LEVEL_THRESHOLDS[user.level] || Infinity;
                        if(updatedUser.xp >= nextLevelXp) updatedUser.level += 1;
                        await updateUser(updatedUser);
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

    const showBanner = !isInitialCheck && (permissions.notifications !== 'granted' || permissions.geolocation !== 'granted');

    return (
        <>
            {showBanner && <PermissionsBanner permissions={permissions} onRequest={handleRequestPermissions} isLoading={isLoading} />}
            {children}
        </>
    );
};

export default PermissionsGuard;