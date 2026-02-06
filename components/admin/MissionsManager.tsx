import React, { useMemo, useState } from 'react';
import { Mission, MissionStatus } from '../../types';
import { useData } from '../../contexts/DataContext';
import AdminMissionCard from './missions/AdminMissionCard';

const MissionColumn: React.FC<{
    title: string;
    missions: Mission[];
    onOpenMission: (mission) => void;
    onEditMission: (mission) => void;
}> = ({ title, missions, onOpenMission, onEditMission }) => {
    const config: { [key: string]: { color: string, label: string } } = {
        [MissionStatus.PENDING]: { color: 'border-brand-light bg-brand-light/5 text-brand-light', label: 'Pendientes' },
        [MissionStatus.IN_PROGRESS]: { color: 'border-brand-blue bg-brand-blue/5 text-brand-blue', label: 'En Curso' },
        [MissionStatus.COMPLETED]: { color: 'border-brand-green bg-brand-green/5 text-brand-green', label: 'Histórico' },
    };

    const status = config[title] || { color: 'border-brand-light', label: title };

    return (
        <div className="flex-1">
            <div className={`p-4 rounded-2xl mb-6 border-l-4 shadow-sm flex items-center justify-between ${status.color}`}>
                <h3 className="font-black text-xs uppercase tracking-widest">{status.label}</h3>
                <span className="font-black text-[10px] bg-white/50 px-2 py-0.5 rounded-lg">{missions.length}</span>
            </div>
            <div className="space-y-6">
                {missions.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-brand-accent rounded-3xl text-center bg-white/50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-light opacity-30">Vacío</span>
                    </div>
                ) : (
                    missions
                        .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())
                        .map(m => <AdminMissionCard key={m.id} mission={m} onOpen={() => onOpenMission(m)} onEdit={() => onEditMission(m)} />)
                )}
            </div>
        </div>
    );
};

interface MissionsManagerProps {
    onOpenMission: (mission: Mission) => void;
    onEditMission: (mission: Mission) => void;
}

const MissionsManager: React.FC<MissionsManagerProps> = ({ onOpenMission, onEditMission }) => {
    const { missions } = useData();
    const [activeTab, setActiveTab] = useState<MissionStatus>(MissionStatus.IN_PROGRESS);

    const { pending, inProgress, completed } = useMemo(() => {
        const missionsToShow = missions.filter(m => m.status !== MissionStatus.REQUESTED);
        return {
            pending: missionsToShow.filter(m => m.status === MissionStatus.PENDING),
            inProgress: missionsToShow.filter(m => m.status === MissionStatus.IN_PROGRESS),
            completed: missionsToShow.filter(m => m.status === MissionStatus.COMPLETED),
        };
    }, [missions]);

    const TABS = [
        { id: MissionStatus.IN_PROGRESS, label: 'En Curso', missions: inProgress },
        { id: MissionStatus.PENDING, label: 'Pendientes', missions: pending },
        { id: MissionStatus.COMPLETED, label: 'Histórico', missions: completed },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-brand-highlight tracking-tight">Estado de Misiones</h2>
                <p className="text-sm text-brand-light leading-none">Supervisa el avance global de todos los proyectos.</p>
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden">
                <div className="flex gap-2 p-1.5 bg-brand-accent/30 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as MissionStatus)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-brand-blue shadow-premium scale-105' : 'text-brand-light'}`}
                        >
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-brand-blue/10' : 'bg-brand-accent/50'}`}>{tab.missions.length}</span>
                        </button>
                    ))}
                </div>
                <div className="animate-fadeIn">
                    <MissionColumn
                        title={activeTab}
                        missions={TABS.find(t => t.id === activeTab)?.missions || []}
                        onOpenMission={onOpenMission}
                        onEditMission={onEditMission}
                    />
                </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:flex gap-10">
                {TABS.map(tab => (
                    <MissionColumn
                        key={tab.id}
                        title={tab.id as MissionStatus}
                        missions={tab.missions}
                        onOpenMission={onOpenMission}
                        onEditMission={onEditMission}
                    />
                ))}
            </div>
        </div>
    );
};

export default MissionsManager;