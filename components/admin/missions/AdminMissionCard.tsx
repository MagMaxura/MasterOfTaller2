import React, { useMemo } from 'react';
import { Mission, User } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';

const AdminMissionCard: React.FC<{ mission: Mission, onOpen: () => void }> = ({ mission, onOpen }) => {
    const { users } = useAppContext();
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const assignedUsers = (mission.assignedTo || []).map(id => usersMap.get(id)).filter((u): u is User => !!u);

    return (
        <div onClick={onOpen} className="bg-brand-secondary p-4 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
            <h4 className="font-bold truncate">{mission.title}</h4>
            <p className="text-sm text-brand-light mt-1 h-10 overflow-hidden">{mission.description}</p>
            
            <div className="flex items-center gap-2 mt-3">
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
            
            <div className="flex justify-between items-center mt-3 text-sm">
                <span className="font-semibold text-brand-orange">{mission.xp} XP</span>
                <span className="px-2 py-1 bg-brand-primary text-xs rounded-full">{mission.difficulty}</span>
            </div>
        </div>
    );
};

export default AdminMissionCard;
