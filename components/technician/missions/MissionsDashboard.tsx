
import React, { useMemo, useState } from 'react';
import { Mission, MissionStatus, User } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import MissionColumn from './MissionColumn';
import RequestMissionModal from './RequestMissionModal';
import { PlusIcon } from '../../Icons';

const AvailableMissionCard: React.FC<{ 
    mission: Mission; 
    onRequest: (missionId: string) => Promise<void>;
    requestType?: 'take' | 'join';
}> = ({ mission, onRequest, requestType = 'take' }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { users } = useData();
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
        <div className="bg-white border border-brand-accent p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
            <div>
                <h4 className="font-bold text-lg text-brand-highlight">{mission.title}</h4>
                <p className="text-sm text-brand-light mt-1">{mission.description.substring(0, 80)}...</p>
            </div>
            {assignedUsers.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-brand-light">Equipo:</span>
                    <div className="flex -space-x-2">
                        {assignedUsers.map(u => (
                            <img key={u.id} src={u.avatar} alt={u.name} title={u.name} className="w-6 h-6 rounded-full ring-2 ring-white border border-brand-accent" />
                        ))}
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mt-auto pt-2 text-sm border-t border-brand-accent/30">
                <span className="font-bold text-brand-orange">{mission.xp} XP</span>
                <span className="px-2 py-1 bg-brand-secondary text-brand-light text-xs rounded-md">{mission.difficulty}</span>
            </div>
             <button
                onClick={handleRequest}
                disabled={isLoading}
                className="w-full bg-brand-blue text-white font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 active:translate-y-0.5 transition-all mt-2 shadow-sm"
            >
                {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                {isLoading ? 'Enviando...' : (requestType === 'join' ? 'Solicitar Unirse' : 'Solicitar Misión')}
            </button>
        </div>
    );
};


interface MissionsDashboardProps {
    user: User;
    onOpenMission: (mission: Mission) => void;
}

const MissionsDashboard: React.FC<MissionsDashboardProps> = ({ user, onOpenMission }) => {
    const { missions, technicianRequestMission, requestToJoinMission } = useData();
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    const { available, otherInProgress, requested, pending, inProgress, completed } = useMemo(() => {
        const visibleMissions = missions.filter(m => m.visibleTo?.includes(user.id));

        const available = visibleMissions.filter(m => (!m.assignedTo || m.assignedTo.length === 0) && m.status === MissionStatus.PENDING && !m.title.startsWith('[UNIRSE]'));
        const userMissions = visibleMissions.filter(m => m.assignedTo?.includes(user.id));
        const otherInProgress = visibleMissions.filter(m => m.status === MissionStatus.IN_PROGRESS && !m.assignedTo?.includes(user.id) && !m.title.startsWith('[UNIRSE]'));
        
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
        <div className="space-y-10">
            <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-3xl font-bold text-brand-highlight tracking-tight">Mis Misiones</h2>
                     <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="bg-white border border-brand-orange text-brand-orange font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-brand-orange hover:text-white transition-all shadow-sm hover:shadow-md"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Solicitar Custom</span>
                    </button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MissionColumn title={MissionStatus.REQUESTED} missions={requested} onOpenMission={onOpenMission} />
                    <MissionColumn title={MissionStatus.PENDING} missions={pending} onOpenMission={onOpenMission} />
                    <MissionColumn title={MissionStatus.IN_PROGRESS} missions={inProgress} onOpenMission={onOpenMission} />
                    <MissionColumn title={MissionStatus.COMPLETED} missions={completed} onOpenMission={onOpenMission} />
                </div>
            </div>

            {(available.length > 0 || otherInProgress.length > 0) && <div className="border-t border-brand-accent my-8"></div>}
            
            {available.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-brand-highlight">Disponibles para Tomar</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {available.map(mission => (
                            <AvailableMissionCard key={mission.id} mission={mission} onRequest={technicianRequestMission} requestType="take" />
                        ))}
                    </div>
                </div>
            )}

            {otherInProgress.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4 mt-8 text-brand-highlight">Unirse a Misión en Progreso</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherInProgress.map(mission => (
                            <AvailableMissionCard key={mission.id} mission={mission} onRequest={requestToJoinMission} requestType="join" />
                        ))}
                    </div>
                </div>
            )}

            {isRequestModalOpen && <RequestMissionModal onClose={() => setIsRequestModalOpen(false)} />}
        </div>
    );
};

export default MissionsDashboard;
