import React from 'react';
import { User, MissionStatus, Role } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

const UserManagement: React.FC<{ onManageInventory: (user: User) => void; onNotifyUser: (user: User) => void; }> = ({ onManageInventory, onNotifyUser }) => {
    const { users, missions, setViewingProfileOf, showToast } = useAppContext();
    const technicians = users.filter(u => u.role === Role.TECHNICIAN);

    const handleNotifyClick = (user: User) => {
        if (!user.pushSubscription) {
            showToast(`${user.name} no está suscrito a las notificaciones.`, 'info');
            return;
        }
        onNotifyUser(user);
    };
    
    return (
        <div className="bg-brand-secondary p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Gestión de Técnicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {technicians.length === 0 && <p className="text-brand-light italic text-center col-span-full p-8">No hay técnicos registrados.</p>}
                {technicians.map(user => {
                    const userMissions = missions.filter(m => m.assignedTo?.includes(user.id));
                    const completed = userMissions.filter(m => m.status === MissionStatus.COMPLETED).length;
                    const inProgress = userMissions.filter(m => m.status === MissionStatus.IN_PROGRESS).length;
                    return (
                        <div key={user.id} className="bg-brand-primary rounded-lg shadow-lg p-4 flex flex-col">
                            <div className="flex items-center mb-4">
                                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-brand-blue" />
                                <div className="ml-4">
                                    <h4 className="font-bold text-lg">{user.name}</h4>
                                    <p className="text-sm text-brand-light">Nivel {user.level} - {user.xp} XP</p>
                                </div>
                            </div>
                            <div className="text-sm space-y-2 mb-4 flex-grow">
                                <p><strong>Misiones Completadas:</strong> {completed}</p>
                                <p><strong>Misiones en Progreso:</strong> {inProgress}</p>
                            </div>
                            <div className="border-t border-brand-accent pt-3 mt-auto grid grid-cols-2 gap-2">
                                <button onClick={() => setViewingProfileOf(user)} className="bg-brand-light text-brand-primary text-sm font-semibold py-2 px-3 rounded hover:bg-brand-highlight transition-colors">Ver Perfil</button>
                                <button onClick={() => onManageInventory(user)} className="bg-brand-accent text-white text-sm font-semibold py-2 px-3 rounded hover:bg-brand-light hover:text-brand-primary transition-colors">Inventario</button>
                                <button onClick={() => handleNotifyClick(user)} className="col-span-2 bg-brand-orange text-brand-primary text-sm font-semibold py-2 px-3 rounded hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!user.pushSubscription}>Enviar Notificación</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserManagement;