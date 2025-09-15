import React, { useMemo } from 'react';
import { Mission, MissionStatus } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import AdminMissionCard from './missions/AdminMissionCard';

const MissionColumn: React.FC<{ title: string; missions: Mission[]; onOpenMission: (mission: Mission) => void; }> = ({ title, missions, onOpenMission }) => {
    const colorMap: { [key: string]: string } = {
        [MissionStatus.PENDING]: 'border-brand-light',
        [MissionStatus.IN_PROGRESS]: 'border-brand-blue',
        [MissionStatus.COMPLETED]: 'border-brand-green',
    };
    return (
        <div className={`bg-brand-primary p-4 rounded-lg flex-1 border-t-4 ${colorMap[title]} min-w-[300px]`}>
            <h3 className="font-bold text-xl mb-4">{title} ({missions.length})</h3>
            <div className="space-y-4">
                {missions.sort((a,b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()).map(m => <AdminMissionCard key={m.id} mission={m} onOpen={() => onOpenMission(m)} />)}
            </div>
        </div>
    );
};

interface MissionsManagerProps {
    onOpenMission: (mission: Mission) => void;
}

const MissionsManager: React.FC<MissionsManagerProps> = ({ onOpenMission }) => {
    const { missions } = useAppContext();

    const { pending, inProgress, completed } = useMemo(() => {
        const missionsToShow = missions.filter(m => m.status !== MissionStatus.REQUESTED);
        return {
            pending: missionsToShow.filter(m => m.status === MissionStatus.PENDING),
            inProgress: missionsToShow.filter(m => m.status === MissionStatus.IN_PROGRESS),
            completed: missionsToShow.filter(m => m.status === MissionStatus.COMPLETED),
        };
    }, [missions]);

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">Estado de Misiones</h2>
            <div className="flex flex-col md:flex-row gap-6">
                <MissionColumn title={MissionStatus.PENDING} missions={pending} onOpenMission={onOpenMission} />
                <MissionColumn title={MissionStatus.IN_PROGRESS} missions={inProgress} onOpenMission={onOpenMission} />
                <MissionColumn title={MissionStatus.COMPLETED} missions={completed} onOpenMission={onOpenMission} />
            </div>
        </div>
    );
};

export default MissionsManager;
