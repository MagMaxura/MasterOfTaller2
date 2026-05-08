import React, { useState, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Role, Company } from '../../../types';
import { LockIcon, UserIcon, BoxIcon, ChartIcon, CurrencyDollarIcon, PlusIcon, TrashIcon, CalendarIcon, MapPinIcon, CogIcon, StarIcon, BriefcaseIcon } from '../../Icons';

const MODULES = [
    { id: 'manage', label: 'Gestionar', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'payroll', label: 'Nómina', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
    { id: 'holidays', label: 'Feriados', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'loans', label: 'Préstamos', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
    { id: 'missions', label: 'Misiones', icon: <BoxIcon className="w-4 h-4" /> },
    { id: 'requests', label: 'Solicitudes', icon: <BoxIcon className="w-4 h-4" /> },
    { id: 'customers', label: 'Seguimiento', icon: <BriefcaseIcon className="w-4 h-4" /> },
    { id: 'recurring_incomes', label: 'Ingresos', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Clasificación', icon: <ChartIcon className="w-4 h-4" /> },
    { id: 'stock', label: 'Stock Equipo', icon: <BoxIcon className="w-4 h-4" /> },
    { id: 'rewards', label: 'Premios', icon: <StarIcon className="w-4 h-4" /> },
    { id: 'orgchart', label: 'Organigrama', icon: <ChartIcon className="w-4 h-4" /> },
    { id: 'supplies', label: 'Insumos', icon: <BoxIcon className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendario', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'live_map', label: 'Mapa', icon: <MapPinIcon className="w-4 h-4" /> },
    { id: 'settings', label: 'Configuración', icon: <CogIcon className="w-4 h-4" /> },
];

const PermissionsManagement: React.FC = () => {
    const { modulePermissions, upsertModulePermission, users } = useData();
    const [viewMode, setViewMode] = useState<'roles' | 'users' | 'companies'>('users');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.is_active && 
            (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             u.role.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [users, searchTerm]);

    const handleToggle = (moduleId: string, target: { role?: Role, user_id?: string, company?: string }) => {
        const existing = modulePermissions.find(p => 
            (target.role && p.role === target.role && p.module_id === moduleId) ||
            (target.user_id && p.user_id === target.user_id && p.module_id === moduleId) ||
            (target.company && p.company === target.company && p.module_id === moduleId)
        );

        upsertModulePermission({
            ...target,
            module_id: moduleId,
            is_enabled: existing ? !existing.is_enabled : true
        });
    };

    const isEnabled = (moduleId: string, target: { role?: Role, user_id?: string, company?: string }) => {
        const perm = modulePermissions.find(p => 
            (target.role && p.role === target.role && p.module_id === moduleId) ||
            (target.user_id && p.user_id === target.user_id && p.module_id === moduleId) ||
            (target.company && p.company === target.company && p.module_id === moduleId)
        );
        return perm ? perm.is_enabled : false;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-brand-highlight tracking-tight">Gestión de Accesos</h3>
                    <p className="text-sm text-brand-light">Configura qué herramientas están disponibles para cada perfil o persona.</p>
                </div>
                <div className="flex bg-brand-secondary p-1 rounded-2xl border border-brand-accent shadow-premium">
                    <button 
                        onClick={() => setViewMode('roles')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'roles' ? 'bg-brand-blue text-white shadow-md' : 'text-brand-light hover:text-brand-highlight'}`}
                    >
                        Roles
                    </button>
                    <button 
                        onClick={() => setViewMode('users')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'users' ? 'bg-brand-blue text-white shadow-md' : 'text-brand-light hover:text-brand-highlight'}`}
                    >
                        Personas
                    </button>
                    <button 
                        onClick={() => setViewMode('companies')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'companies' ? 'bg-brand-blue text-white shadow-md' : 'text-brand-light hover:text-brand-highlight'}`}
                    >
                        Empresas
                    </button>
                </div>
            </div>

            {viewMode === 'users' && (
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o rol..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-brand-accent rounded-2xl text-sm font-bold shadow-premium focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    />
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-light group-focus-within:text-brand-blue transition-colors" />
                </div>
            )}

            <div className="bg-white rounded-[32px] overflow-hidden border border-brand-accent shadow-premium">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-secondary/50 border-b border-brand-accent text-[10px] text-brand-light uppercase font-black tracking-[0.2em]">
                                <th className="p-6 min-w-[220px]">Herramienta / Módulo</th>
                                {viewMode === 'roles' && Object.values(Role).map(role => (
                                    <th key={role} className="p-6 text-center whitespace-nowrap">{role}</th>
                                ))}
                                {viewMode === 'companies' && Object.values(Company).map(company => (
                                    <th key={company} className="p-6 text-center whitespace-nowrap">{company}</th>
                                ))}
                                {viewMode === 'users' && filteredUsers.map(user => (
                                    <th key={user.id} className="p-6 text-center whitespace-nowrap min-w-[120px]">
                                        <div className="flex flex-col items-center gap-1">
                                            <img src={user.avatar} className="w-8 h-8 rounded-full border border-brand-accent object-cover shadow-sm" alt="" />
                                            <span className="max-w-[100px] truncate text-[10px] font-black text-brand-highlight">{user.name.split(' ')[0]}</span>
                                            <span className="text-[8px] text-brand-light font-black uppercase opacity-60 tracking-tighter">{user.role}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-accent text-sm">
                            {MODULES.map((module) => (
                                <tr key={module.id} className="hover:bg-brand-secondary/30 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-brand-secondary rounded-xl flex items-center justify-center text-brand-light group-hover:text-brand-blue group-hover:bg-brand-blue/10 transition-all transform group-hover:scale-110">
                                                {module.icon}
                                            </div>
                                            <div>
                                                <span className="font-black text-brand-highlight block leading-tight">{module.label}</span>
                                                <span className="text-[10px] text-brand-light font-bold uppercase opacity-60 tracking-widest">{module.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    {viewMode === 'roles' && Object.values(Role).map(role => (
                                        <td key={role} className="p-6 text-center">
                                            <PermissionToggle 
                                                enabled={isEnabled(module.id, { role })} 
                                                onToggle={() => handleToggle(module.id, { role })} 
                                            />
                                        </td>
                                    ))}
                                    {viewMode === 'companies' && Object.values(Company).map(company => (
                                        <td key={company} className="p-6 text-center">
                                            <PermissionToggle 
                                                enabled={isEnabled(module.id, { company })} 
                                                onToggle={() => handleToggle(module.id, { company })} 
                                            />
                                        </td>
                                    ))}
                                    {viewMode === 'users' && filteredUsers.map(user => (
                                        <td key={user.id} className="p-6 text-center">
                                            <PermissionToggle 
                                                enabled={isEnabled(module.id, { user_id: user.id })} 
                                                onToggle={() => handleToggle(module.id, { user_id: user.id })} 
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 bg-brand-secondary/30 border-t border-brand-accent">
                    <p className="text-[10px] font-black text-brand-light uppercase tracking-widest text-center flex items-center justify-center gap-2">
                        <LockIcon className="w-3 h-3" />
                        Nota: Los permisos específicos por persona tienen prioridad sobre los permisos por rol.
                    </p>
                </div>
            </div>
        </div>
    );
};

const PermissionToggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
    <label className="relative inline-flex items-center cursor-pointer transform hover:scale-110 transition-transform">
        <input 
            type="checkbox" 
            className="sr-only peer"
            checked={enabled}
            onChange={onToggle}
        />
        <div className="w-11 h-6 bg-brand-accent/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue shadow-inner"></div>
    </label>
);

export default PermissionsManagement;
