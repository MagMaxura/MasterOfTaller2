
import React, { useMemo } from 'react';
import { User, MissionStatus, Role } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

const UserManagement: React.FC<{ 
    onManageInventory: (user: User) => void; 
    onManageBadges: (user: User) => void;
    onNotifyUser: (user: User) => void; 
    onSetSalary: (user: User) => void;
}> = ({ onManageInventory, onManageBadges, onNotifyUser, onSetSalary }) => {
    const { users, missions, salaries, setViewingProfileOf, deactivateUser } = useData();
    const { showToast } = useToast();
    const technicians = users.filter(u => u.role === Role.TECHNICIAN);

    const handleNotifyClick = (user: User) => {
        if (!user.pushSubscription) {
            showToast(`${user.name} no está suscrito a las notificaciones.`, 'info');
            return;
        }
        onNotifyUser(user);
    };

    const handleDeactivate = async (userToDeactivate: User) => {
        if (window.confirm(`¿Estás seguro de que quieres desactivar a ${userToDeactivate.name}? El técnico ya no aparecerá en la aplicación, pero su historial de misiones se conservará. Esta acción se puede revertir desde la base de datos.`)) {
            try {
                await deactivateUser(userToDeactivate.id);
                showToast(`${userToDeactivate.name} ha sido desactivado.`, 'success');
            } catch (error) {
                showToast(error instanceof Error ? error.message : "Error al desactivar el técnico.", 'error');
            }
        }
    };
    
    return (
        <div className="bg-brand-secondary p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-6">Gestión de Técnicos</h3>
            <div className="space-y-4">
                {technicians.length === 0 && <p className="text-brand-light italic text-center p-8">No hay técnicos registrados.</p>}
                {technicians.map(user => {
                    const userMissions = missions.filter(m => m.assignedTo?.includes(user.id));
                    const completed = userMissions.filter(m => m.status === MissionStatus.COMPLETED).length;
                    const inProgress = userMissions.filter(m => m.status === MissionStatus.IN_PROGRESS).length;
                    const salary = salaries.find(s => s.user_id === user.id);

                    return (
                        <div key={user.id} className="bg-brand-primary rounded-lg shadow-sm border border-brand-accent p-4 flex flex-col lg:flex-row items-start lg:items-center gap-6 transition-all hover:shadow-md">
                            {/* Perfil */}
                            <div className="flex items-center gap-4 min-w-[250px]">
                                <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full border-2 border-brand-blue object-cover" />
                                <div>
                                    <h4 className="font-bold text-lg text-brand-highlight">{user.name}</h4>
                                    <p className="text-sm text-brand-light">Nivel {user.level} - {user.xp} XP</p>
                                </div>
                            </div>

                            {/* Estadísticas y Salario */}
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-brand-accent pt-4 lg:pt-0 lg:pl-6 text-sm">
                                <div>
                                    <p className="text-brand-light text-xs uppercase font-bold">Completadas</p>
                                    <p className="font-semibold text-brand-highlight">{completed}</p>
                                </div>
                                <div>
                                    <p className="text-brand-light text-xs uppercase font-bold">En Progreso</p>
                                    <p className="font-semibold text-brand-highlight">{inProgress}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-brand-light text-xs uppercase font-bold">Salario Base (Qincenal)</p>
                                    <p className={`font-bold ${salary ? 'text-brand-green' : 'text-brand-orange'}`}>
                                        {salary ? formatCurrency(salary.monto_base_quincenal) : 'No definido'}
                                    </p>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end mt-2 lg:mt-0">
                                <button onClick={() => setViewingProfileOf(user)} className="bg-brand-light/10 text-brand-highlight text-xs font-semibold py-2 px-3 rounded hover:bg-brand-light/20 transition-colors border border-brand-accent">Perfil</button>
                                <button onClick={() => onManageInventory(user)} className="bg-brand-light/10 text-brand-highlight text-xs font-semibold py-2 px-3 rounded hover:bg-brand-light/20 transition-colors border border-brand-accent">Inventario</button>
                                <button onClick={() => onManageBadges(user)} className="bg-brand-light/10 text-brand-highlight text-xs font-semibold py-2 px-3 rounded hover:bg-brand-light/20 transition-colors border border-brand-accent">Insignias</button>
                                <button onClick={() => onSetSalary(user)} className="bg-brand-blue text-white text-xs font-semibold py-2 px-3 rounded hover:bg-blue-600 transition-colors">Salario</button>
                                <button onClick={() => handleNotifyClick(user)} className="bg-brand-orange text-white text-xs font-semibold py-2 px-3 rounded hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!user.pushSubscription}>Notificar</button>
                                <button onClick={() => handleDeactivate(user)} className="bg-brand-red/10 text-brand-red text-xs font-semibold py-2 px-3 rounded hover:bg-brand-red/20 transition-colors">Desactivar</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserManagement;
