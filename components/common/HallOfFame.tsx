import React, { useMemo } from 'react';
import { Mission, User, MissionStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const HallOfFame: React.FC<{missions: Mission[], users: User[]}> = ({missions, users}) => {
    const { currentUser } = useAuth();
    const completedMissionsWithPhotos = useMemo(() => {
        if (!currentUser) return [];
        return missions.filter(m => 
            m.visibleTo?.includes(currentUser.id) && 
            m.status === MissionStatus.COMPLETED && 
            m.progressPhoto
        );
    }, [missions, currentUser]);

    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-center">Muro de la Fama</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedMissionsWithPhotos.length > 0 ? completedMissionsWithPhotos.map(mission => {
                    const assignedUsers = (mission.assignedTo || []).map(id => usersMap.get(id)).filter(Boolean) as User[];
                    const userNames = assignedUsers.map(u => u.name).join(', ');
                    return (
                        <div key={mission.id} className="bg-brand-primary rounded-lg overflow-hidden shadow-md group">
                            <img src={mission.progressPhoto} alt={mission.title} className="w-full h-48 object-cover transition-transform group-hover:scale-105"/>
                            <div className="p-4">
                                <h4 className="font-bold truncate">{mission.title}</h4>
                                {userNames && <p className="text-sm text-brand-light truncate">Por: {userNames}</p>}
                                <p className="text-xs text-brand-accent mt-1">Completada: {new Date(mission.completedDate!).toLocaleDateString()}</p>
                            </div>
                        </div>
                    );
                }) : <p className="text-brand-light text-center italic col-span-full">Aún no hay fotos en el muro de la fama. ¡Completa misiones y sube tus logros!</p>}
            </div>
        </div>
    );
};

export default HallOfFame;