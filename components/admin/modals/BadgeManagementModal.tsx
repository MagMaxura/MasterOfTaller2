import React, { useState, useMemo } from 'react';
import { User, Badge } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';

const BadgeManagementModal: React.FC<{ user: User; onClose: () => void; }> = ({ user, onClose }) => {
    const { allBadges, assignBadge, revokeBadge } = useData();
    const { showToast } = useToast();
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const userBadgeIds = useMemo(() => new Set(user.badges.map(b => b.id)), [user.badges]);
    const availableBadges = useMemo(() => 
        allBadges.filter(b => !userBadgeIds.has(b.id))
                 .sort((a, b) => a.name.localeCompare(b.name)), 
    [allBadges, userBadgeIds]);

    const handleAssign = async (badge: Badge) => {
        setLoading(prev => ({ ...prev, [badge.id]: true }));
        try {
            await assignBadge(user.id, badge.id);
            showToast(`Insignia "${badge.name}" asignada a ${user.name}.`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al asignar insignia.", 'error');
        } finally {
            setLoading(prev => ({ ...prev, [badge.id]: false }));
        }
    };

    const handleRevoke = async (badge: Badge) => {
        setLoading(prev => ({ ...prev, [badge.id]: true }));
        try {
            await revokeBadge(user.id, badge.id);
            showToast(`Insignia "${badge.name}" quitada de ${user.name}.`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al quitar insignia.", 'error');
        } finally {
            setLoading(prev => ({ ...prev, [badge.id]: false }));
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-secondary rounded-lg max-w-4xl w-full p-6 relative flex flex-col max-h-[90vh]">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-4">Gestionar Insignias de {user.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden">
                    {/* Assigned Badges */}
                    <div className="bg-brand-primary p-4 rounded-lg flex flex-col">
                        <h4 className="font-bold mb-3 text-lg">Insignias Asignadas</h4>
                        <div className="space-y-2 overflow-y-auto">
                            {user.badges.length === 0 && <p className="text-brand-light italic text-center p-4">Este técnico no tiene insignias.</p>}
                            {user.badges.map((badge) => (
                                <div key={badge.id} className="flex items-center bg-brand-secondary p-2 rounded" title={badge.description}>
                                    <img src={badge.icon} alt={badge.name} className="w-10 h-10 rounded-full mr-3 bg-brand-accent p-1"/>
                                    <span className="flex-grow font-semibold">{badge.name}</span>
                                    <button onClick={() => handleRevoke(badge)} disabled={loading[badge.id]} className="bg-brand-red text-white px-3 py-1 text-sm rounded hover:bg-red-700 disabled:opacity-50 w-20 text-center">
                                        {loading[badge.id] ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mx-auto"></div> : 'Quitar'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Available Badges */}
                    <div className="bg-brand-primary p-4 rounded-lg flex flex-col">
                        <h4 className="font-bold mb-3 text-lg">Insignias Disponibles</h4>
                        <div className="space-y-2 overflow-y-auto">
                            {availableBadges.length === 0 && <p className="text-brand-light italic text-center p-4">No hay más insignias para asignar.</p>}
                            {availableBadges.map(badge => (
                                 <div key={badge.id} className="flex items-center bg-brand-secondary p-2 rounded" title={badge.description}>
                                    <img src={badge.icon} alt={badge.name} className="w-10 h-10 rounded-full mr-3 bg-brand-accent p-1"/>
                                    <span className="flex-grow font-semibold">{badge.name}</span>
                                    <button onClick={() => handleAssign(badge)} disabled={loading[badge.id]} className="bg-brand-green text-brand-primary font-bold px-3 py-1 text-sm rounded hover:bg-green-300 disabled:opacity-50 w-20 text-center">
                                         {loading[badge.id] ? <div className="w-4 h-4 border-2 border-t-transparent border-brand-primary rounded-full animate-spin mx-auto"></div> : 'Asignar'}
                                    </button>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BadgeManagementModal;
