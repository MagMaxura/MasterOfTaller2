
import React from 'react';
import { Mission } from '../../../types';

const MissionCard: React.FC<{ mission: Mission, onOpen: () => void }> = ({ mission, onOpen }) => (
    <div onClick={onOpen} className="bg-white border border-brand-accent/60 p-4 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer border-l-4 border-l-brand-blue group">
        <h4 className="font-bold text-brand-highlight group-hover:text-brand-blue transition-colors">{mission.title}</h4>
        <p className="text-sm text-brand-light mt-2 line-clamp-2">{mission.description}</p>
        <div className="flex justify-between items-center mt-4 text-sm">
            <span className="font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded text-xs">{mission.xp} XP</span>
            <span className="px-2 py-1 bg-brand-secondary text-brand-light text-xs rounded-md border border-brand-accent">{mission.difficulty}</span>
        </div>
    </div>
);

export default MissionCard;
