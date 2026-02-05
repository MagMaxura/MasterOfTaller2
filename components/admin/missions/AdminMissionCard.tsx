
import React, { useMemo, useState } from 'react';
import { Mission, User } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { EyeOffIcon } from '../../Icons';

const AdminMissionCard: React.FC<{ mission: Mission, onOpen: () => void, onEdit: () => void }> = ({ mission, onOpen, onEdit }) => {
    const { users, deleteMission } = useData();
    const { showToast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const assignedUsers = (mission.assignedTo || []).map(id => usersMap.get(id)).filter((u): u is User => !!u);
    const visibleToUsers = (mission.visibleTo || []).map(id => usersMap.get(id)).filter((u): u is User => !!u);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent onOpen from firing
        if (window.confirm(`¿Estás seguro de que quieres eliminar la misión "${mission.title}"? Esta acción no se puede deshacer.`)) {
            setIsDeleting(true);
            try {
                await deleteMission(mission.id);
                showToast('Misión eliminada con éxito.', 'success');
            } catch (error) {
                showToast(error instanceof Error ? error.message : 'No se pudo eliminar la misión.', 'error');
                setIsDeleting(false);
            }
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit();
    };

    return (
        <div onClick={onOpen} className="relative bg-white border border-brand-accent/60 p-4 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col gap-3 group">
            {(!mission.visibleTo || mission.visibleTo.length === 0) && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10 border border-brand-accent">
                    <div className="bg-brand-highlight text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                        <EyeOffIcon className="w-4 h-4" />
                        <span className="text-xs font-bold">Oculta</span>
                    </div>
                </div>
            )}
            <div>
                <h4 className="font-bold text-brand-highlight truncate group-hover:text-brand-blue transition-colors">{mission.title}</h4>
                <p className="text-sm text-brand-light mt-1 h-10 overflow-hidden">{mission.description}</p>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-brand-light">Equipo:</span>
                {assignedUsers.length > 0 ? (
                    <div className="flex -space-x-2">
                        {assignedUsers.map(u => (
                            <img key={u.id} src={u.avatar} alt={u.name} title={u.name} className="w-6 h-6 rounded-full ring-2 ring-white border border-brand-accent" />
                        ))}
                    </div>
                ) : (
                    <span className="text-xs italic text-brand-accent">Sin asignar</span>
                )}
            </div>

            <div className="flex justify-between items-center text-sm border-t border-brand-accent/50 mt-2 pt-3">
                <div>
                    <span className="font-bold text-brand-orange">{mission.xp} XP</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleEdit} className="text-brand-blue bg-blue-50 hover:bg-blue-100 text-xs font-semibold py-1 px-3 rounded transition-colors">
                        Editar
                    </button>
                    <button onClick={handleDelete} disabled={isDeleting} className="text-brand-red bg-red-50 hover:bg-red-100 text-xs font-semibold py-1 px-3 rounded transition-colors disabled:opacity-50 flex items-center gap-1">
                        {isDeleting && <div className="w-3 h-3 border-2 border-t-transparent border-brand-red rounded-full animate-spin"></div>}
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminMissionCard;
