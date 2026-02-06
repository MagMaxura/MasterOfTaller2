import React, { useMemo, useState } from 'react';
import { Mission, User } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { EyeOffIcon, StarIcon, EditIcon, LogoutIcon } from '../../Icons';

const AdminMissionCard: React.FC<{ mission: Mission, onOpen: () => void, onEdit: () => void }> = ({ mission, onOpen, onEdit }) => {
    const { users, deleteMission } = useData();
    const { showToast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const assignedUsers = (mission.assignedTo || []).map(id => usersMap.get(id)).filter((u): u is User => !!u);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`¿Estás seguro de que quieres eliminar "${mission.title}"?`)) {
            setIsDeleting(true);
            try {
                await deleteMission(mission.id);
                showToast('Misión eliminada.', 'success');
            } catch (error) {
                showToast(error instanceof Error ? error.message : 'Error al eliminar.', 'error');
                setIsDeleting(false);
            }
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit();
    };

    const isHidden = !mission.visibleTo || mission.visibleTo.length === 0;

    return (
        <div
            onClick={onOpen}
            className="group relative bg-white rounded-3xl p-5 shadow-soft hover:shadow-premium hover:-translate-y-1 transition-all cursor-pointer border-t-[6px] border-brand-blue active:scale-[0.98]"
        >
            {isHidden && (
                <div className="absolute top-3 right-3 z-20 bg-brand-highlight text-white p-2 rounded-xl shadow-lg animate-pulse">
                    <EyeOffIcon className="w-3.5 h-3.5" />
                </div>
            )}

            <div className="mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md">
                    Misión ID: {mission.id.substring(0, 5)}
                </span>
                <h4 className="font-black text-lg text-brand-highlight leading-tight mt-2 line-clamp-1 group-hover:text-brand-blue transition-colors">
                    {mission.title}
                </h4>
                <p className="text-xs text-brand-light mt-1.5 line-clamp-2 leading-relaxed">
                    {mission.description}
                </p>
            </div>

            <div className="flex items-center justify-between mb-5">
                <div className="flex -space-x-3">
                    {assignedUsers.length > 0 ? (
                        assignedUsers.map(u => (
                            <img key={u.id} src={u.avatar} alt={u.name} className="w-8 h-8 rounded-xl ring-4 ring-white border border-brand-accent object-cover shadow-sm" />
                        ))
                    ) : <span className="text-[10px] font-bold text-brand-light/50 uppercase italic">Sin Equipo</span>}
                </div>
                <div className="flex items-center gap-1.5 bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-xl">
                    <StarIcon className="w-3.5 h-3.5 fill-brand-orange" />
                    <span className="text-xs font-black">{mission.xp} XP</span>
                </div>
            </div>

            <div className="flex gap-2 relative z-20 border-t border-brand-accent/50 pt-4">
                <button
                    onClick={handleEdit}
                    className="flex-1 h-11 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-blue hover:text-white transition-all font-black text-xs uppercase tracking-widest"
                >
                    <EditIcon className="w-4 h-4" />
                    <span>Editar</span>
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 h-11 bg-brand-red/10 text-brand-red rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-red hover:text-white transition-all font-black text-xs uppercase tracking-widest disabled:opacity-30"
                >
                    {isDeleting ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <LogoutIcon className="w-4 h-4" />}
                    <span>Eliminar</span>
                </button>
            </div>

            {isHidden && <div className="absolute inset-0 bg-brand-accent/20 backdrop-blur-[0.5px] rounded-3xl pointer-events-none"></div>}
        </div>
    );
};

export default AdminMissionCard;
