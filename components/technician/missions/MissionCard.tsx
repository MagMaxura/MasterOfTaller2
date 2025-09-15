import React from 'react';
import { Mission } from '../../../types';

const MissionCard: React.FC<{ mission: Mission, onOpen: () => void }> = ({ mission, onOpen }) => (
    <div onClick={onOpen} className="bg-brand-secondary p-4 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border-l-4 border-brand-blue">
        <h4 className="font-bold">{mission.title}</h4>
        <p className="text-sm text-brand-light mt-1">{mission.description.substring(0, 50)}...</p>
        <div className="flex justify-between items-center mt-3 text-sm">
            <span className="font-semibold text-brand-orange">{mission.xp} XP</span>
            <span className="px-2 py-1 bg-brand-accent text-xs rounded-full">{mission.difficulty}</span>
        </div>
    </div>
);

export default MissionCard;
