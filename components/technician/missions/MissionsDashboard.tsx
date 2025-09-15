import React, { useMemo, useState } from 'react';
import { Mission, MissionStatus, User } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';
import MissionColumn from './MissionColumn';
import RequestMissionModal from './RequestMissionModal';
import { PlusIcon } from '../../Icons';

const AvailableMissionCard: React.FC<{ 
    mission: Mission; 
    onRequest: (missionId: string) => Promise<void>;
    requestType?: 'take' | 'join';
}> = ({ mission, onRequest, requestType = 'take' }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { users } = useAppContext();
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const handleRequest = async () => {
        setIsLoading(true);
        try {
            await onRequest(mission.id);
        } catch (error) {
            console.error(`Failed to ${requestType} mission`, error)
        }
        // Don't setIsLoading(false) on success, as the component will likely unmount.
        // Only set it on error to allow retry.
        if (!isLoading) setIsLoading(false);
    };
    
    const assignedUsers = (mission.assignedTo || []).map(id => usersMap.get(id)).filter(Boolean) as User[];
    
    return (
        <div className="bg-brand-secondary p-4 rounded-lg shadow-md border-l-4 border-brand-accent flex flex-col gap-3">
            <div>
                <h4 className="font-bold">{mission.title}</h4>
                <p className="text-sm text-brand-light mt-1">{mission.description.substring(0, 80)}...</p>
            </div>
            {assignedUsers.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold">Equipo:</span>
                    <div className="flex -space-x-2">
                        {assignedUsers.map(u => (
                            <img key={u.id} src={u.avatar} alt={u.name} title={u.name} className="w-6 h-6 rounded-full ring-2 ring-brand-secondary" />
                        ))}
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mt-auto pt-2 text-sm">
                <span className="font-semibold text-brand-orange">{mission.xp} XP</span>
                <span className="px-2 py-1 bg-brand-primary text-xs rounded-full">{mission.difficulty}</span>
            </div>
             <button
                onClick={handleRequest}
                disabled={isLoading}
                className="w-full bg-brand-blue text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent hover:bg-blue-700 transition-colors mt-2"
            >
                {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                {isLoading ? 'Enviando...' : (requestType === 'join' ? 'Solicitar Unirse' : 'Solicitar')}
            </button>
        </div>
    );
};


interface MissionsDashboardProps {
    user: User;
    onOpenMission: (mission: Mission) => void;
}

const MissionsDashboard: React.FC<MissionsDashboardProps> = ({ user, onOpenMission }) => {
    const { missions, technicianRequestMission, requestToJoinMission } = useAppContext();
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    const { available, otherInProgress, requested, pending, inProgress, completed } = useMemo(() => {
        const available = missions.filter(m => (!m.assignedTo || m.assignedTo.length === 0) && m.status === MissionStatus.PENDING && !m.title.startsWith('[UNIRSE]'));
        const userMissions = missions.filter(m => m.assignedTo?.includes(user.id));
        const otherInProgress = missions.filter(m => m.status === MissionStatus.IN_PROGRESS && !m.assignedTo?.includes(user.id) && !m.title.startsWith('[UNIRSE]'));
        
        return {
            available,
            otherInProgress,
            requested: userMissions.filter(m => m.status === MissionStatus.REQUESTED),
            pending: userMissions.filter(m => m.status === MissionStatus.PENDING),
            inProgress: userMissions.filter(m => m.status === MissionStatus.IN_PROGRESS),
            completed: userMissions.filter(m => m.status === MissionStatus.COMPLETED),
        };
    }, [missions, user.id]);

    return (
        <div className="space-y-8">
            <div>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-2xl font-bold">Mis Misiones</h2>
                     <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="bg-brand-orange text-brand-primary font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-orange-400 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Solicitar Misión Custom
                    </button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MissionColumn title={MissionStatus.REQUESTED} missions={requested} onOpenMission={onOpenMission} />
                    <MissionColumn title={MissionStatus.PENDING} missions={pending} onOpenMission={onOpenMission} />
                    <MissionColumn title={MissionStatus.IN_PROGRESS} missions={inProgress} onOpenMission={onOpenMission} />
                    <MissionColumn title={MissionStatus.COMPLETED} missions={completed} onOpenMission={onOpenMission} />
                </div>
            </div>

            <div className="border-t border-brand-accent my-8"></div>
            
            <div>
                <h2 className="text-2xl font-bold mb-4">Misiones Disponibles para Solicitar</h2>
                {available.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {available.map(mission => (
                            <AvailableMissionCard key={mission.id} mission={mission} onRequest={technicianRequestMission} requestType="take" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-brand-secondary p-8 rounded-lg text-center text-brand-light italic">
                        No hay misiones disponibles en este momento. ¡Vuelve a consultar más tarde!
                    </div>
                )}
            </div>

             <div className="border-t border-brand-accent my-8"></div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Otras Misiones en Progreso</h2>
                {otherInProgress.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherInProgress.map(mission => (
                            <AvailableMissionCard key={mission.id} mission={mission} onRequest={requestToJoinMission} requestType="join" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-brand-secondary p-8 rounded-lg text-center text-brand-light italic">
                        No hay otras misiones en progreso en este momento.
                    </div>
                )}
            </div>

            {isRequestModalOpen && <RequestMissionModal onClose={() => setIsRequestModalOpen(false)} />}
        </div>
    );
};

export default MissionsDashboard;