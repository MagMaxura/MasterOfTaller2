
import React from 'react';
import { User, MissionStatus, Role } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { PlusIcon, StarIcon, BoxIcon, BadgeIcon, CurrencyDollarIcon, BellIcon, LogoutIcon, UserIcon } from '../Icons';

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-brand-highlight tracking-tight">Gestión de Técnicos</h3>
                    <p className="text-sm text-brand-light">Administra el personal, salarios y equipamiento.</p>
                </div>
                <div className="hidden sm:block">
                    <span className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                        {technicians.length} Técnicos
                    </span>
                </div>
            </div>

            {/* Mobile Cards / Desktop Table Wrapper */}
            <div className="bg-white md:bg-transparent rounded-3xl md:rounded-none overflow-hidden shadow-premium md:shadow-none">
                <table className="w-full text-left border-collapse">
                    <thead className="hidden md:table-header-group">
                        <tr className="border-b border-brand-accent text-[10px] text-brand-light uppercase font-black tracking-[0.2em]">
                            <th className="pb-4 pt-2 font-bold px-4 text-center">Técnico</th>
                            <th className="pb-4 pt-2 font-bold px-4 text-center">Rendimiento</th>
                            <th className="pb-4 pt-2 font-bold px-4 text-center">Misiones</th>
                            <th className="pb-4 pt-2 font-bold px-4 text-right">Salario</th>
                            <th className="pb-4 pt-2 font-bold px-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent md:divide-none">
                        {technicians.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-brand-light italic">No hay técnicos registrados.</td>
                            </tr>
                        )}
                        {technicians.map(user => {
                            const userMissions = missions.filter(m => m.assignedTo?.includes(user.id));
                            const completed = userMissions.filter(m => m.status === MissionStatus.COMPLETED).length;
                            const inProgress = userMissions.filter(m => m.status === MissionStatus.IN_PROGRESS).length;
                            const salary = salaries.find(s => s.user_id === user.id);

                            return (
                                <tr key={user.id} className="block md:table-row md:hover:bg-brand-secondary transition-all group md:bg-white md:rounded-2xl md:mb-2 md:shadow-soft">
                                    {/* USER INFO */}
                                    <td className="p-5 md:p-4 block md:table-cell md:rounded-l-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-xl border border-brand-accent object-cover shadow-sm transition-transform group-hover:scale-105" />
                                                <div className="absolute -top-1 -right-1 bg-brand-blue text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border-2 border-white">{user.level}</div>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-brand-highlight leading-tight">{user.name}</h4>
                                                <button onClick={() => setViewingProfileOf(user)} className="text-[10px] uppercase tracking-wider font-bold text-brand-blue hover:text-brand-highlight flex items-center gap-1 mt-0.5 transition-colors">
                                                    <UserIcon className="w-3 h-3" /> Ver Perfil
                                                </button>
                                            </div>
                                        </div>
                                    </td>

                                    {/* PROGRESS / XP */}
                                    <td className="px-5 py-2 md:py-4 md:text-center block md:table-cell border-t md:border-t-0 border-brand-accent/30">
                                        <div className="flex md:flex-col items-center justify-between md:justify-center">
                                            <span className="md:hidden text-[10px] font-black text-brand-light uppercase tracking-widest">Nivel / XP</span>
                                            <div className="text-right md:text-center">
                                                <div className="flex items-center gap-1 md:justify-center">
                                                    <StarIcon className="w-3 h-3 text-brand-orange fill-brand-orange" />
                                                    <span className="font-black text-brand-highlight">Nivel {user.level}</span>
                                                </div>
                                                <div className="w-24 md:w-20 bg-brand-accent h-1.5 rounded-full mt-1 overflow-hidden">
                                                    <div className="bg-brand-orange h-full" style={{ width: `${(user.xp % 1000) / 10}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-brand-light block mt-0.5">{user.xp} XP acumulados</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* MISSIONS */}
                                    <td className="px-5 py-2 md:py-4 md:text-center block md:table-cell border-t md:border-t-0 border-brand-accent/30">
                                        <div className="flex md:flex-col items-center justify-between md:justify-center">
                                            <span className="md:hidden text-[10px] font-black text-brand-light uppercase tracking-widest">Eficiencia</span>
                                            <div className="flex justify-center gap-4 text-sm">
                                                <div className="text-center">
                                                    <span className="text-brand-green font-black block leading-none">{completed}</span>
                                                    <span className="text-[8px] font-black uppercase text-brand-light tracking-tighter">Éxitos</span>
                                                </div>
                                                <div className="text-center opacity-70">
                                                    <span className="text-brand-blue font-black block leading-none">{inProgress}</span>
                                                    <span className="text-[8px] font-black uppercase text-brand-light tracking-tighter">Activo</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* SALARY */}
                                    <td className="px-5 py-2 md:py-4 text-right block md:table-cell border-t md:border-t-0 border-brand-accent/30">
                                        <div className="flex md:flex-col items-center justify-between md:justify-end">
                                            <span className="md:hidden text-[10px] font-black text-brand-light uppercase tracking-widest text-left">Presupuesto</span>
                                            <div className="text-right">
                                                <p className={`font-black tracking-tight ${salary ? 'text-brand-green' : 'text-brand-orange'}`}>
                                                    {salary ? formatCurrency(salary.monto_base_quincenal) : 'Sin sueldo'}
                                                </p>
                                                <p className="text-[9px] font-black text-brand-light uppercase leading-none opacity-60">Base Quincenal</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="p-5 md:p-4 text-right block md:table-cell border-t md:border-t-0 border-brand-accent/30 md:rounded-r-2xl bg-brand-secondary/30 md:bg-transparent">
                                        <div className="flex justify-end gap-2 sm:gap-3 flex-wrap">
                                            <ActionBtn onClick={() => onSetSalary(user)} color="green" icon={<CurrencyDollarIcon className="w-4 h-4" />} label="Salario" />
                                            <ActionBtn onClick={() => onManageInventory(user)} color="blue" icon={<BoxIcon className="w-4 h-4" />} label="Stock" />
                                            <ActionBtn onClick={() => onManageBadges(user)} color="orange" icon={<BadgeIcon className="w-4 h-4" />} label="Logros" />
                                            <ActionBtn onClick={() => handleNotifyClick(user)} color="blue" icon={<BellIcon className="w-4 h-4" />} label="Notificar" disabled={!user.pushSubscription} />
                                            <ActionBtn onClick={() => handleDeactivate(user)} color="red" icon={<LogoutIcon className="w-4 h-4" />} label="Baja" />
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

const ActionBtn: React.FC<{
    onClick: () => void,
    color: 'green' | 'blue' | 'orange' | 'red',
    icon: React.ReactNode,
    label: string,
    disabled?: boolean
}> = ({ onClick, color, icon, label, disabled }) => {
    const colors = {
        green: 'text-brand-green bg-brand-green/10 hover:bg-brand-green hover:text-white',
        blue: 'text-brand-blue bg-brand-blue/10 hover:bg-brand-blue hover:text-white',
        orange: 'text-brand-orange bg-brand-orange/10 hover:bg-brand-orange hover:text-white',
        red: 'text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`min-w-[44px] h-[44px] rounded-xl flex items-center justify-center transition-all duration-300 ${colors[color]} disabled:opacity-20 disabled:grayscale`}
            title={label}
        >
            {icon}
        </button>
    );
};

export default UserManagement;
