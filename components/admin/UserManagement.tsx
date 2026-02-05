
import React from 'react';
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
        if (window.confirm(`¿Estás seguro de que quieres desactivar a ${userToDeactivate.name}?`)) {
            try {
                await deactivateUser(userToDeactivate.id);
                showToast(`${userToDeactivate.name} ha sido desactivado.`, 'success');
            } catch (error) {
                showToast(error instanceof Error ? error.message : "Error al desactivar.", 'error');
            }
        }
    };
    
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-6 text-brand-highlight">Gestión de Técnicos</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-brand-accent text-sm text-brand-light uppercase tracking-wider">
                            <th className="p-4 font-semibold">Técnico</th>
                            <th className="p-4 font-semibold text-center">Nivel / XP</th>
                            <th className="p-4 font-semibold text-center">Misiones</th>
                            <th className="p-4 font-semibold text-right">Salario Base</th>
                            <th className="p-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent">
                        {technicians.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-brand-light italic">No hay técnicos registrados.</td>
                            </tr>
                        )}
                        {technicians.map(user => {
                            const userMissions = missions.filter(m => m.assignedTo?.includes(user.id));
                            const completed = userMissions.filter(m => m.status === MissionStatus.COMPLETED).length;
                            const inProgress = userMissions.filter(m => m.status === MissionStatus.IN_PROGRESS).length;
                            const salary = salaries.find(s => s.user_id === user.id);

                            return (
                                <tr key={user.id} className="hover:bg-brand-primary transition-colors group bg-white md:bg-transparent rounded-lg md:rounded-none mb-4 md:mb-0 block md:table-row shadow md:shadow-none border md:border-0 border-brand-accent">
                                    <td className="p-4 block md:table-cell">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-brand-accent object-cover" />
                                            <div>
                                                <h4 className="font-bold text-brand-highlight">{user.name}</h4>
                                                <button onClick={() => setViewingProfileOf(user)} className="text-xs text-brand-blue hover:underline">Ver Perfil</button>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center block md:table-cell border-t md:border-t-0 border-brand-accent/20">
                                        <div className="flex md:flex-col items-center justify-between md:justify-center">
                                            <span className="md:hidden text-xs font-bold text-brand-light uppercase">Nivel</span>
                                            <div>
                                                <span className="font-bold text-brand-highlight block">Lvl {user.level}</span>
                                                <span className="text-xs text-brand-light">{user.xp} XP</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center block md:table-cell border-t md:border-t-0 border-brand-accent/20">
                                        <div className="flex md:flex-col items-center justify-between md:justify-center">
                                            <span className="md:hidden text-xs font-bold text-brand-light uppercase">Misiones</span>
                                            <div className="flex justify-center gap-3 text-sm">
                                                <div title="Completadas">
                                                    <span className="text-brand-green font-bold">{completed}</span>
                                                    <span className="text-brand-light ml-1">✓</span>
                                                </div>
                                                <div title="En Progreso">
                                                    <span className="text-brand-blue font-bold">{inProgress}</span>
                                                    <span className="text-brand-light ml-1">↻</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right block md:table-cell border-t md:border-t-0 border-brand-accent/20">
                                         <div className="flex md:flex-col items-center justify-between md:justify-end">
                                            <span className="md:hidden text-xs font-bold text-brand-light uppercase">Salario</span>
                                            <div>
                                                <p className={`font-bold ${salary ? 'text-brand-green' : 'text-brand-orange'}`}>
                                                    {salary ? formatCurrency(salary.monto_base_quincenal) : 'No definido'}
                                                </p>
                                                <p className="text-[10px] text-brand-light uppercase hidden md:block">Quincenal</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right block md:table-cell border-t md:border-t-0 border-brand-accent/20">
                                        <div className="flex justify-end gap-2 flex-wrap max-w-full md:max-w-[200px] ml-auto">
                                            <button onClick={() => onSetSalary(user)} className="p-2 text-brand-light hover:text-brand-green bg-brand-secondary hover:bg-green-50 rounded border border-brand-accent transition-colors" title="Definir Salario">
                                                💲
                                            </button>
                                            <button onClick={() => onManageInventory(user)} className="p-2 text-brand-light hover:text-brand-blue bg-brand-secondary hover:bg-blue-50 rounded border border-brand-accent transition-colors" title="Inventario">
                                                📦
                                            </button>
                                            <button onClick={() => onManageBadges(user)} className="p-2 text-brand-light hover:text-brand-orange bg-brand-secondary hover:bg-orange-50 rounded border border-brand-accent transition-colors" title="Insignias">
                                                🏅
                                            </button>
                                            <button onClick={() => handleNotifyClick(user)} disabled={!user.pushSubscription} className="p-2 text-brand-light hover:text-brand-blue bg-brand-secondary hover:bg-blue-50 rounded border border-brand-accent transition-colors disabled:opacity-30" title="Notificar">
                                                🔔
                                            </button>
                                            <button onClick={() => handleDeactivate(user)} className="p-2 text-brand-light hover:text-brand-red bg-brand-secondary hover:bg-red-50 rounded border border-brand-accent transition-colors" title="Desactivar">
                                                🚫
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
