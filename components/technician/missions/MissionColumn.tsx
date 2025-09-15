import React from 'react';
import { Mission, MissionStatus } from '../../../types';
import MissionCard from './MissionCard';

const MissionColumn: React.FC<{ title: string; missions: Mission[]; onOpenMission: (mission: Mission) => void; }> = ({ title, missions, onOpenMission }) => {
    const colorMap: { [key: string]: string } = {
        [MissionStatus.REQUESTED]: 'border-brand-orange',
        [MissionStatus.PENDING]: 'border-brand-light',
        [MissionStatus.IN_PROGRESS]: 'border-brand-blue',
        [MissionStatus.COMPLETED]: 'border-brand-green',
    };
    return (
        <div className={`bg-brand-primary p-4 rounded-lg flex-1 border-t-4 ${colorMap[title]}`}>
            <h3 className="font-bold text-xl mb-4">{title} ({missions.length})</h3>
            <div className="space-y-4">
                {missions.map(m => <MissionCard key={m.id} mission={m} onOpen={() => onOpenMission(m)} />)}
            </div>
        </div>
    );
};

export default MissionColumn;