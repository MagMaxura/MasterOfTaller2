import React from 'react';
import { Mission, MissionStatus } from '../../../types';
import MissionCard from './MissionCard';

const MissionColumn: React.FC<{ title: string; missions: Mission[]; onOpenMission: (mission: Mission) => void; }> = ({ title, missions, onOpenMission }) => {
    const config: { [key: string]: { color: string, label: string } } = {
        [MissionStatus.REQUESTED]: { color: 'text-brand-orange bg-brand-orange/5 border-brand-orange', label: 'Solicitadas' },
        [MissionStatus.PENDING]: { color: 'text-brand-light bg-brand-light/5 border-brand-light', label: 'Pendientes' },
        [MissionStatus.IN_PROGRESS]: { color: 'text-brand-blue bg-brand-blue/5 border-brand-blue', label: 'En Curso' },
        [MissionStatus.COMPLETED]: { color: 'text-brand-green bg-brand-green/5 border-brand-green', label: 'Historial' },
    };

    const status = config[title] || { color: 'text-brand-light border-brand-light', label: title };

    return (
        <div className="flex flex-col h-full">
            <div className={`flex items-center justify-between p-3 rounded-xl mb-4 border-l-4 ${status.color}`}>
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">{status.label}</h3>
                <span className="bg-white/50 px-2 py-0.5 rounded-lg font-black text-[10px]">{missions.length}</span>
            </div>
            <div className="space-y-4">
                {missions.length === 0 ? (
                    <div className="border-2 border-dashed border-brand-accent/50 rounded-2xl p-8 text-center bg-white/50">
                        <p className="text-[10px] font-black uppercase text-brand-light tracking-widest opacity-40">Sin misiones</p>
                    </div>
                ) : (
                    missions.map(m => <MissionCard key={m.id} mission={m} onOpen={() => onOpenMission(m)} />)
                )}
            </div>
        </div>
    );
};

export default MissionColumn;