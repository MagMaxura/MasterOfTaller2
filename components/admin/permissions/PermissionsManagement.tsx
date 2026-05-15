import React, { useState, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Role, User } from '../../../types';
import {
    LockIcon, UserIcon, BoxIcon, ChartIcon, CurrencyDollarIcon,
    CalendarIcon, MapPinIcon, CogIcon, StarIcon, BriefcaseIcon, TasksIcon,
    ChefIcon, UtensilsIcon,
} from '../../Icons';

const MODULES = [
    { id: 'manage', label: 'Gestionar Usuarios', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'payroll', label: 'Nómina', icon: <CurrencyDollarIcon className="w-5 h-5" /> },
    { id: 'holidays', label: 'Feriados', icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'loans', label: 'Préstamos', icon: <CurrencyDollarIcon className="w-5 h-5" /> },
    { id: 'missions', label: 'Misiones', icon: <TasksIcon className="w-5 h-5" /> },
    { id: 'requests', label: 'Solicitudes', icon: <TasksIcon className="w-5 h-5" /> },
    { id: 'customers', label: 'Seguimiento Clientes', icon: <BriefcaseIcon className="w-5 h-5" /> },
    { id: 'recurring_incomes', label: 'Ingresos Recurrentes', icon: <CurrencyDollarIcon className="w-5 h-5" /> },
    { id: 'leaderboard', label: 'Clasificación', icon: <ChartIcon className="w-5 h-5" /> },
    { id: 'stock', label: 'Stock / Equipamiento', icon: <BoxIcon className="w-5 h-5" /> },
    { id: 'rewards', label: 'Premios', icon: <StarIcon className="w-5 h-5" /> },
    { id: 'orgchart', label: 'Organigrama', icon: <ChartIcon className="w-5 h-5" /> },
    { id: 'supplies', label: 'Insumos', icon: <BoxIcon className="w-5 h-5" /> },
    { id: 'calendar', label: 'Calendario', icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'live_map', label: 'Mapa en Vivo', icon: <MapPinIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Configuración', icon: <CogIcon className="w-5 h-5" /> },
    { id: 'cocinero', label: 'Cocinero (Gestión cocina)', icon: <ChefIcon className="w-5 h-5" /> },
    { id: 'comensal', label: 'Comensal (Confirmar almuerzo)', icon: <UtensilsIcon className="w-5 h-5" /> },
];

const ROLE_LABELS: Record<string, string> = {
    administrador: 'Administrador',
    operaciones: 'Operaciones',
    ventas: 'Ventas',
    administrativo: 'Administrativo',
    marketing: 'Marketing',
    tecnico: 'Técnico',
    limpieza: 'Limpieza',
};

const ROLE_COLORS: Record<string, string> = {
    administrador: 'bg-purple-100 text-purple-700',
    operaciones: 'bg-blue-100 text-blue-700',
    ventas: 'bg-green-100 text-green-700',
    administrativo: 'bg-amber-100 text-amber-700',
    marketing: 'bg-pink-100 text-pink-700',
    tecnico: 'bg-cyan-100 text-cyan-700',
    limpieza: 'bg-gray-100 text-gray-600',
};

const PermissionsManagement: React.FC = () => {
    const { modulePermissions, upsertModulePermission, deleteModulePermission, users } = useData();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [search, setSearch] = useState('');

    const activeUsers = useMemo(() =>
        users
            .filter(u => u.is_active && u.role !== Role.ADMIN)
            .filter(u =>
                !search ||
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.role.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
        [users, search]
    );

    // For a given module and user, returns: user-specific perm | role perm | null
    const getEffectivePerm = (moduleId: string, user: User) => {
        const userPerm = modulePermissions.find(p => p.user_id === user.id && p.module_id === moduleId);
        if (userPerm) return { perm: userPerm, source: 'user' as const };
        const rolePerm = modulePermissions.find(p => p.role === user.role && p.module_id === moduleId);
        if (rolePerm) return { perm: rolePerm, source: 'role' as const };
        return null;
    };

    const handleToggle = async (moduleId: string, user: User) => {
        const existing = modulePermissions.find(p => p.user_id === user.id && p.module_id === moduleId);
        const effective = getEffectivePerm(moduleId, user);
        const currentlyEnabled = effective ? effective.perm.is_enabled : false;

        if (existing) {
            // If it was a user-specific override, toggle it
            await upsertModulePermission({ ...existing, is_enabled: !existing.is_enabled });
        } else {
            // Create user-specific permission (overrides role)
            await upsertModulePermission({ user_id: user.id, module_id: moduleId, is_enabled: !currentlyEnabled });
        }
    };

    const handleResetToRole = async (moduleId: string, user: User) => {
        const existing = modulePermissions.find(p => p.user_id === user.id && p.module_id === moduleId);
        if (existing) await deleteModulePermission(existing.id);
    };

    const enabledCount = selectedUser
        ? MODULES.filter(m => {
            const eff = getEffectivePerm(m.id, selectedUser);
            return eff ? eff.perm.is_enabled : false;
        }).length
        : 0;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-black text-brand-highlight tracking-tight">Gestión de Accesos</h3>
                <p className="text-sm text-brand-light mt-1">Seleccioná una persona y habilitá o deshabilitá sus herramientas.</p>
            </div>

            <div className="flex gap-6 min-h-[600px]">
                {/* LEFT — User list */}
                <div className="w-72 flex-shrink-0 flex flex-col gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar persona..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-brand-accent rounded-2xl text-sm font-semibold shadow-sm focus:ring-2 focus:ring-brand-blue outline-none"
                        />
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-light" />
                    </div>

                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[540px] pr-1 custom-scrollbar">
                        {activeUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all border ${
                                    selectedUser?.id === user.id
                                        ? 'bg-brand-blue/10 border-brand-blue shadow-md scale-[1.02]'
                                        : 'bg-white border-brand-accent hover:bg-brand-secondary/50 hover:border-brand-blue/30'
                                }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-brand-accent" />
                                    {selectedUser?.id === user.id && (
                                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-brand-blue rounded-full border-2 border-white" />
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-black text-sm text-brand-highlight truncate leading-tight">{user.name}</p>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                                        {ROLE_LABELS[user.role] || user.role}
                                    </span>
                                </div>
                            </button>
                        ))}
                        {activeUsers.length === 0 && (
                            <p className="text-center text-sm text-brand-light py-8">Sin resultados</p>
                        )}
                    </div>
                </div>

                {/* RIGHT — Module toggles */}
                <div className="flex-1 min-w-0">
                    {!selectedUser ? (
                        <div className="h-full flex flex-col items-center justify-center text-center bg-white rounded-[32px] border border-brand-accent border-dashed p-12">
                            <div className="w-16 h-16 bg-brand-secondary rounded-2xl flex items-center justify-center mb-4">
                                <LockIcon className="w-8 h-8 text-brand-light" />
                            </div>
                            <p className="font-black text-brand-highlight text-lg">Seleccioná una persona</p>
                            <p className="text-sm text-brand-light mt-1">Elegí a alguien de la lista para configurar sus accesos.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[32px] border border-brand-accent shadow-premium overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center gap-4 p-6 border-b border-brand-accent bg-brand-secondary/30">
                                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-blue shadow-md" />
                                <div className="flex-1">
                                    <h4 className="font-black text-xl text-brand-highlight leading-tight">{selectedUser.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ROLE_COLORS[selectedUser.role] || 'bg-gray-100 text-gray-600'}`}>
                                            {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                                        </span>
                                        <span className="text-xs text-brand-light font-semibold">
                                            {enabledCount} de {MODULES.length} herramientas habilitadas
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="text-brand-light hover:text-brand-highlight p-2 rounded-xl hover:bg-brand-secondary transition-all text-lg font-black"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Module grid */}
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[460px] custom-scrollbar">
                                {MODULES.map(module => {
                                    const effective = getEffectivePerm(module.id, selectedUser);
                                    const isOn = effective ? effective.perm.is_enabled : false;
                                    const hasUserOverride = !!modulePermissions.find(p => p.user_id === selectedUser.id && p.module_id === module.id);
                                    const roleHasPerm = !!modulePermissions.find(p => p.role === selectedUser.role && p.module_id === module.id);

                                    return (
                                        <div
                                            key={module.id}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                                                isOn
                                                    ? 'bg-brand-blue/5 border-brand-blue/30'
                                                    : 'bg-brand-secondary/30 border-brand-accent'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isOn ? 'bg-brand-blue text-white' : 'bg-brand-secondary text-brand-light'}`}>
                                                {module.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-black text-sm leading-tight ${isOn ? 'text-brand-highlight' : 'text-brand-light'}`}>
                                                    {module.label}
                                                </p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {hasUserOverride ? (
                                                        <button
                                                            onClick={() => handleResetToRole(module.id, selectedUser)}
                                                            className="text-[9px] font-black text-brand-blue uppercase tracking-wider hover:underline"
                                                            title="Resetear al permiso del rol"
                                                        >
                                                            Personal · resetear
                                                        </button>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-brand-light uppercase tracking-wider opacity-60">
                                                            {roleHasPerm ? 'Heredado del rol' : 'Sin permiso de rol'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={isOn}
                                                    onChange={() => handleToggle(module.id, selectedUser)}
                                                />
                                                <div className="w-11 h-6 bg-brand-accent/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue shadow-inner" />
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="px-6 py-4 border-t border-brand-accent bg-brand-secondary/20">
                                <p className="text-[10px] font-black text-brand-light uppercase tracking-widest flex items-center gap-2">
                                    <LockIcon className="w-3 h-3" />
                                    Los permisos personales tienen prioridad sobre los del rol. "Resetear" vuelve al permiso del rol.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PermissionsManagement;
