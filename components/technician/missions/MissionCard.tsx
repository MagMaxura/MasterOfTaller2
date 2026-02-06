import React from 'react';
import { Mission } from '../../../types';
import { StarIcon, ArrowUpIcon } from '../../Icons';

const MissionCard: React.FC<{ mission: Mission, onOpen: () => void }> = ({ mission, onOpen }) => (
    <div
        onClick={onOpen}
        className="bg-white p-5 rounded-2xl shadow-soft hover:shadow-premium hover:-translate-y-1 transition-all cursor-pointer border-l-[6px] border-brand-blue group relative overflow-hidden active:scale-95"
    >
        <div className="flex justify-between items-start mb-2">
            <h4 className="font-black text-brand-highlight group-hover:text-brand-blue transition-colors leading-tight pr-8">{mission.title}</h4>
            <div className="absolute top-4 right-4 text-brand-blue/20 group-hover:text-brand-blue/50 transition-colors">
                <ArrowUpIcon className="w-5 h-5 rotate-45" />
            </div>
        </div>
        <p className="text-xs text-brand-light line-clamp-2 leading-relaxed mb-4">{mission.description}</p>
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
            <div className="flex items-center gap-1 bg-brand-orange/10 text-brand-orange px-2 py-1 rounded-lg">
                <StarIcon className="w-3 h-3 fill-brand-orange" />
                <span>{mission.xp} XP</span>
            </div>
            <span className="px-2 py-1 bg-brand-secondary text-brand-light rounded-lg border border-brand-accent/50">{mission.difficulty}</span>
        </div>
    </div>
);

export default MissionCard;
