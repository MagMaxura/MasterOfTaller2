
import React from 'react';
import { User, MissionStatus, Role, Company } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { PlusIcon, StarIcon, BoxIcon, BadgeIcon, CurrencyDollarIcon, BellIcon, LogoutIcon, UserIcon, ClockIcon, EditIcon } from '../Icons';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

const UserManagement: React.FC<{
    onManageInventory: (user: User) => void;
    onManageBadges: (user: User) => void;
    onNotifyUser: (user: User) => void;
    onSetSalary: (user: User) => void;
    onShowAttendance: (user: User) => void;
}> = ({ onManageInventory, onManageBadges, onNotifyUser, onSetSalary, onShowAttendance }) => {
    const { users, missions, salaries, setViewingProfileOf, deactivateUser, updateUser } = useData();
    const { showToast } = useToast();
    const [activeRole, setActiveRole] = React.useState<Role>(Role.TECHNICIAN);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);

    const filteredUsers = users.filter(u => u.role === activeRole);

    const roles = [
        { id: Role.TECHNICIAN, label: 'Técnicos' },
        { id: Role.ADMINISTRATIVE, label: 'Administración' },
        { id: Role.MARKETING, label: 'Marketing' },
        { id: Role.SALES, label: 'Ventas' },
    ];

    const companies = Object.values(Company);

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

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            await updateUser(editingUser.id, {
                role: editingUser.role,
                company: editingUser.company
            });
            showToast('Usuario actualizado correctamente.', 'success');
            setEditingUser(null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al actualizar.", 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-brand-highlight tracking-tight">Gestión de Personal</h3>
                    <p className="text-sm text-brand-light">Administra el talento de todas las áreas de la empresa.</p>
                </div>
                <div className="flex bg-brand-secondary p-1 rounded-2xl border border-brand-accent shadow-inner overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setActiveRole(role.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeRole === role.id
                                ? 'bg-white text-brand-blue shadow-premium'
                                : 'text-brand-light hover:text-brand-highlight'
                                }`}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Cards / Desktop Table Wrapper */}
            <div className="bg-white md:bg-transparent rounded-3xl md:rounded-none overflow-hidden shadow-premium md:shadow-none">
                <table className="w-full text-left border-collapse">
                    <thead className="hidden md:table-header-group">
                        <tr className="border-b border-brand-accent text-[10px] text-brand-light uppercase font-black tracking-[0.2em]">
                            <th className="pb-4 pt-2 font-bold px-4 text-left">Miembro</th>
                            <th className="pb-4 pt-2 font-bold px-4 text-center">Progreso</th>
                            <th className="pb-4 pt-2 font-bold px-4 text-center">Tareas</th>
                            <th className="pb-4 pt-2 font-bold px-4 text-right">Sueldo / Empresa</th>
                            <th className="pb-4 pt-2 font-bold px-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent md:divide-none">
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-brand-light italic">No hay personal registrado en esta área.</td>
                            </tr>
                        )}
                        {filteredUsers.map(user => {
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

                                    {/* SALARY / COMPANY */}
                                    <td className="px-5 py-2 md:py-4 text-right block md:table-cell border-t md:border-t-0 border-brand-accent/30">
                                        <div className="flex md:flex-col items-center justify-between md:justify-end">
                                            <span className="md:hidden text-[10px] font-black text-brand-light uppercase tracking-widest text-left">Datos</span>
                                            <div className="text-right">
                                                <p className={`font-black tracking-tight ${salary ? 'text-brand-green' : 'text-brand-orange'}`}>
                                                    {salary ? formatCurrency(salary.monto_base_quincenal) : 'Sin sueldo'}
                                                </p>
                                                <p className="text-[9px] font-black text-brand-blue uppercase leading-none mt-1">
                                                    {user.company || 'Sin Empresa'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="p-5 md:p-4 text-right block md:table-cell border-t md:border-t-0 border-brand-accent/30 md:rounded-r-2xl bg-brand-secondary/30 md:bg-transparent">
                                        <div className="flex justify-end gap-2 sm:gap-3 flex-wrap">
                                            <ActionBtn onClick={() => onShowAttendance(user)} color="blue" icon={<ClockIcon className="w-4 h-4" />} label="Asistencia" />
                                            <ActionBtn onClick={() => onSetSalary(user)} color="green" icon={<CurrencyDollarIcon className="w-4 h-4" />} label="Salario" />
                                            <ActionBtn onClick={() => setEditingUser(user)} color="orange" icon={<EditIcon className="w-4 h-4" />} label="Editar Perfil" />
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

            {/* EDIT USER MODAL */}
            {editingUser && (
                <div className="fixed inset-0 bg-brand-highlight/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-brand-accent">
                        <div className="bg-brand-secondary px-8 py-6 border-b border-brand-accent">
                            <h4 className="text-xl font-black text-brand-highlight tracking-tight">Editar Perfil</h4>
                            <p className="text-xs text-brand-light font-bold uppercase tracking-widest mt-1">{editingUser.name}</p>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Área / Rol</label>
                                <select
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                                >
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    <option value={Role.ADMIN}>Administrador Total</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Empresa</label>
                                <select
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                    value={editingUser.company || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, company: e.target.value as Company })}
                                >
                                    <option value="">Seleccionar Empresa</option>
                                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border border-brand-accent text-brand-light hover:bg-brand-secondary transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-brand-blue text-white shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
