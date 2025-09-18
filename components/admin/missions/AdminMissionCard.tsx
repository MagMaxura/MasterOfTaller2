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
        <div onClick={onOpen} className="relative bg-brand-secondary p-4 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col gap-3">
            {(!mission.visibleTo || mission.visibleTo.length === 0) && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center z-10">
                    <EyeOffIcon className="w-8 h-8 text-brand-light" />
                    <span className="ml-2 font-bold text-brand-light">No visible</span>
                </div>
            )}
            <div>
                <h4 className="font-bold truncate">{mission.title}</h4>
                <p className="text-sm text-brand-light mt-1 h-10 overflow-hidden">{mission.description}</p>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Equipo:</span>
                {assignedUsers.length > 0 ? (
                    <div className="flex -space-x-2">
                        {assignedUsers.map(u => (
                            <img key={u.id} src={u.avatar} alt={u.name} title={u.name} className="w-6 h-6 rounded-full ring-2 ring-brand-secondary" />
                        ))}
                    </div>
                ) : (
                    <span className="text-xs italic text-brand-accent">Sin asignar</span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Visible para:</span>
                {visibleToUsers.length > 0 ? (
                    <div className="flex -space-x-2">
                        {visibleToUsers.map(u => (
                            <img key={u.id} src={u.avatar} alt={u.name} title={u.name} className="w-6 h-6 rounded-full ring-2 ring-brand-secondary" />
                        ))}
                    </div>
                ) : (
                    <span className="text-xs italic text-brand-accent">Nadie</span>
                )}
            </div>
            
            <div className="flex justify-between items-center text-sm border-t border-brand-accent/50 mt-2 pt-3">
                <div>
                    <span className="font-semibold text-brand-orange">{mission.xp} XP</span>
                    <span className="ml-3 px-2 py-1 bg-brand-primary text-xs rounded-full">{mission.difficulty}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleEdit} className="bg-brand-blue text-white text-xs font-semibold py-1 px-3 rounded hover:bg-blue-700 transition-colors">
                        Editar
                    </button>
                    <button onClick={handleDelete} disabled={isDeleting} className="bg-brand-red text-white text-xs font-semibold py-1 px-3 rounded hover:bg-red-700 transition-colors disabled:bg-brand-accent flex items-center gap-1">
                        {isDeleting && <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminMissionCard;