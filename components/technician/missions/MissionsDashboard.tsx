
import React, { useMemo, useState } from 'react';
import { Mission, MissionStatus, User } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import MissionColumn from './MissionColumn';
import RequestMissionModal from './RequestMissionModal';
import { PlusIcon, StarIcon, ArrowUpIcon, BoxIcon } from '../../Icons';

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
        if (!isLoading) setIsLoading(false);
    };

    const assignedUsers = (mission.assignedTo || []).map(id => usersMap.get(id)).filter(Boolean) as User[];

    return (
        <div className="bg-white border border-brand-accent p-6 rounded-3xl shadow-soft hover:shadow-premium transition-all flex flex-col gap-4 relative group active:scale-[0.98]">
            {requestType === 'join' && (
                <div className="absolute -top-3 left-6 bg-brand-blue text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                    Colaborativa
                </div>
            )}
            <div>
                <h4 className="font-black text-xl text-brand-highlight tracking-tight leading-tight group-hover:text-brand-blue transition-colors">{mission.title}</h4>
                <p className="text-xs text-brand-light mt-2 line-clamp-2 leading-relaxed">{mission.description}</p>
            </div>

            <div className="flex items-center justify-between">
                {assignedUsers.length > 0 ? (
                    <div className="flex -space-x-3">
                        {assignedUsers.map(u => (
                            <img key={u.id} src={u.avatar} alt={u.name} className="w-8 h-8 rounded-xl ring-4 ring-white border border-brand-accent object-cover shadow-sm" />
                        ))}
                    </div>
                ) : <div className="p-2 rounded-xl bg-brand-secondary text-brand-light"><BoxIcon className="w-4 h-4 opacity-50" /></div>}
                <div className="text-right">
                    <span className="font-black text-brand-orange flex items-center gap-1 justify-end">
                        <StarIcon className="w-4 h-4 fill-brand-orange" />
                        {mission.xp} XP
                    </span>
                    <span className="text-[10px] font-black text-brand-light uppercase tracking-tighter opacity-70">{mission.difficulty}</span>
                </div>
            </div>

            <button
                onClick={handleRequest}
                disabled={isLoading}
                className="w-full bg-brand-highlight text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:bg-brand-blue hover:shadow-lg active:scale-95"
            >
                {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <ArrowUpIcon className="w-4 h-4 rotate-45" />}
                <span className="text-xs uppercase tracking-widest">
                    {isLoading ? 'Solicitando...' : (requestType === 'join' ? 'Unirse al Equipo' : 'Tomar Desafío')}
                </span>
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
    const [activeTab, setActiveTab] = useState<MissionStatus>(MissionStatus.IN_PROGRESS);

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

    const TABS_CONFIG = [
        { id: MissionStatus.IN_PROGRESS, label: 'En Curso', count: inProgress.length, missions: inProgress },
        { id: MissionStatus.PENDING, label: 'Pendientes', count: pending.length, missions: pending },
        { id: MissionStatus.REQUESTED, label: 'Solicitadas', count: requested.length, missions: requested },
        { id: MissionStatus.COMPLETED, label: 'Historial', count: completed.length, missions: completed },
    ];

    return (
        <div className="space-y-12">
            <div>
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-brand-highlight tracking-tight">Mis Misiones</h2>
                        <p className="text-sm text-brand-light mt-1">Sigue tu progreso y gestiona tus tareas activas.</p>
                    </div>
                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="bg-brand-highlight text-white font-black p-3.5 rounded-2xl flex items-center gap-2 hover:bg-brand-blue transition-all shadow-lg active:scale-95 sm:px-6"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Solicitar Custom</span>
                    </button>
                </div>

                {/* Mobile View: Tabbed Board */}
                <div className="md:hidden space-y-6">
                    <div className="flex gap-2 p-1.5 bg-brand-accent/30 rounded-2xl overflow-x-auto no-scrollbar">
                        {TABS_CONFIG.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as MissionStatus)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-brand-blue shadow-premium' : 'text-brand-light'}`}
                            >
                                {tab.label}
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-accent/50'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="animate-fadeIn">
                        <MissionColumn
                            title={activeTab}
                            missions={TABS_CONFIG.find(t => t.id === activeTab)?.missions || []}
                            onOpenMission={onOpenMission}
                        />
                    </div>
                </div>

                {/* Desktop View: Grid Columns */}
                <div className="hidden md:grid grid-cols-4 gap-8">
                    {TABS_CONFIG.map(tab => (
                        <MissionColumn key={tab.id} title={tab.id as MissionStatus} missions={tab.missions} onOpenMission={onOpenMission} />
                    ))}
                </div>
            </div>

            {(available.length > 0 || otherInProgress.length > 0) && <div className="h-px bg-brand-accent w-full"></div>}

            {available.length > 0 && (
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-brand-highlight tracking-tight">Tablón de Anuncios</h2>
                        <p className="text-xs text-brand-light font-bold uppercase tracking-widest mt-1">Misiones disponibles para tomar ahora</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {available.map(mission => (
                            <AvailableMissionCard key={mission.id} mission={mission} onRequest={technicianRequestMission} requestType="take" />
                        ))}
                    </div>
                </section>
            )}

            {otherInProgress.length > 0 && (
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-brand-highlight tracking-tight">Refuerzos Necesarios</h2>
                        <p className="text-xs text-brand-light font-bold uppercase tracking-widest mt-1">Únete a otros maestros en sus trabajos actuales</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {otherInProgress.map(mission => (
                            <AvailableMissionCard key={mission.id} mission={mission} onRequest={requestToJoinMission} requestType="join" />
                        ))}
                    </div>
                </section>
            )}

            {isRequestModalOpen && <RequestMissionModal onClose={() => setIsRequestModalOpen(false)} />}
        </div>
    );
};

export default MissionsDashboard;
