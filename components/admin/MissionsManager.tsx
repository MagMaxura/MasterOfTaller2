import React, { useMemo, useState } from 'react';
import { Mission, MissionStatus } from '../../types';
import { useData } from '../../contexts/DataContext';
import AdminMissionCard from './missions/AdminMissionCard';
import KnowledgeBase from '../knowledge/KnowledgeBase';
import MissionCalendar from '../MissionCalendar';
import MissionsGanttView from './missions/MissionsGanttView';
import MissionCreator from './MissionCreator';
import { BookOpenIcon, CalendarIcon, ChartIcon, PlusIcon, TasksIcon } from '../Icons';

type MissionsViewMode = 'kanban' | 'gantt' | 'almanac';

const MissionColumn: React.FC<{
  title: string;
  missions: Mission[];
  onOpenMission: (mission: Mission) => void;
  onEditMission: (mission: Mission) => void;
  onCreateMission: () => void;
}> = ({ title, missions, onOpenMission, onEditMission, onCreateMission }) => {
  const config: { [key: string]: { color: string; label: string } } = {
    [MissionStatus.PENDING]: { color: 'border-brand-light bg-brand-light/5 text-brand-light', label: 'Pendientes' },
    [MissionStatus.IN_PROGRESS]: { color: 'border-brand-blue bg-brand-blue/5 text-brand-blue', label: 'En Curso' },
    [MissionStatus.COMPLETED]: { color: 'border-brand-green bg-brand-green/5 text-brand-green', label: 'Historico' }
  };

  const status = config[title] || { color: 'border-brand-light', label: title };

  return (
    <div className="flex-1" onDoubleClick={onCreateMission}>
      <div className={`p-4 rounded-2xl mb-6 border-l-4 shadow-sm flex items-center justify-between ${status.color}`}>
        <h3 className="font-black text-xs uppercase tracking-widest">{status.label}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateMission}
            className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-brand-blue transition-colors"
            title="Crear nueva mision"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
          <span className="font-black text-[10px] bg-white/50 px-2 py-0.5 rounded-lg">{missions.length}</span>
        </div>
      </div>
      <div className="space-y-6">
        {missions.length === 0 ? (
          <button
            type="button"
            onClick={onCreateMission}
            className="w-full p-12 border-2 border-dashed border-brand-accent rounded-3xl text-center bg-white/50 hover:bg-white/80 transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-light opacity-30">Vacio</span>
          </button>
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
  const { missions, users } = useData();
  const [activeTab, setActiveTab] = useState<MissionStatus>(MissionStatus.IN_PROGRESS);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [viewMode, setViewMode] = useState<MissionsViewMode>('kanban');
  const [isCreatingMission, setIsCreatingMission] = useState(false);
  const [createStartDate, setCreateStartDate] = useState<string | undefined>(undefined);

  const { pending, inProgress, completed } = useMemo(() => {
    const missionsToShow = missions.filter(m => m.status !== MissionStatus.REQUESTED);
    return {
      pending: missionsToShow.filter(m => m.status === MissionStatus.PENDING),
      inProgress: missionsToShow.filter(m => m.status === MissionStatus.IN_PROGRESS),
      completed: missionsToShow.filter(m => m.status === MissionStatus.COMPLETED)
    };
  }, [missions]);

  const TABS = [
    { id: MissionStatus.IN_PROGRESS, label: 'En Curso', missions: inProgress },
    { id: MissionStatus.PENDING, label: 'Pendientes', missions: pending },
    { id: MissionStatus.COMPLETED, label: 'Historico', missions: completed }
  ];

  const selectedStatusMissions = TABS.find(tab => tab.id === activeTab)?.missions ?? [];
  const allMissionRows = useMemo(() => [...inProgress, ...pending, ...completed], [completed, inProgress, pending]);
  const openCreateMission = (date?: string) => {
    setCreateStartDate(date);
    setIsCreatingMission(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-brand-highlight tracking-tight">
            {showKnowledgeBase ? 'Base de Saber' : 'Estado de Misiones'}
          </h2>
          <p className="text-sm text-brand-light leading-none">
            {showKnowledgeBase ? 'Consulta y gestiona el aprendizaje colectivo del equipo.' : 'Supervisa el avance global de todos los proyectos.'}
          </p>
        </div>
        <button
          onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${showKnowledgeBase ? 'bg-brand-blue text-white shadow-premium' : 'bg-brand-secondary text-brand-light border border-brand-accent hover:text-brand-highlight'}`}
        >
          {showKnowledgeBase ? <TasksIcon className="w-4 h-4" /> : <BookOpenIcon className="w-4 h-4" />}
          {showKnowledgeBase ? 'Ver Misiones' : 'Base de Saber'}
        </button>
      </div>
      {!showKnowledgeBase && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => openCreateMission()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-black uppercase tracking-widest shadow-premium hover:brightness-110 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva Mision
          </button>
        </div>
      )}

      {showKnowledgeBase ? (
        <div className="animate-fadeIn">
          <KnowledgeBase />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex gap-2 p-1.5 bg-brand-accent/30 rounded-2xl">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'kanban' ? 'bg-white text-brand-blue shadow-premium' : 'text-brand-light'}`}
              >
                <TasksIcon className="w-4 h-4" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'gantt' ? 'bg-white text-brand-blue shadow-premium' : 'text-brand-light'}`}
              >
                <ChartIcon className="w-4 h-4" />
                Gantt
              </button>
              <button
                onClick={() => setViewMode('almanac')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'almanac' ? 'bg-white text-brand-blue shadow-premium' : 'text-brand-light'}`}
              >
                <CalendarIcon className="w-4 h-4" />
                Almanaque
              </button>
            </div>

            {viewMode !== 'kanban' && (
              <div className="flex gap-2 p-1.5 bg-brand-accent/30 rounded-2xl overflow-x-auto no-scrollbar">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-brand-blue shadow-premium' : 'text-brand-light'}`}
                  >
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-brand-blue/10' : 'bg-brand-accent/50'}`}>{tab.missions.length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {viewMode === 'kanban' && (
            <>
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
                    missions={selectedStatusMissions}
                    onOpenMission={onOpenMission}
                    onEditMission={onEditMission}
                    onCreateMission={() => openCreateMission()}
                  />
                </div>
              </div>

              <div className="hidden md:flex gap-10">
                {TABS.map(tab => (
                  <MissionColumn
                    key={tab.id}
                    title={tab.id as MissionStatus}
                    missions={tab.missions}
                    onOpenMission={onOpenMission}
                    onEditMission={onEditMission}
                    onCreateMission={() => openCreateMission()}
                  />
                ))}
              </div>
            </>
          )}

          {viewMode === 'gantt' && (
            <div className="animate-fadeIn">
              <MissionsGanttView missions={selectedStatusMissions} users={users} onOpenMission={onOpenMission} onCreateMission={() => openCreateMission()} />
            </div>
          )}

          {viewMode === 'almanac' && (
            <div className="animate-fadeIn">
              <MissionCalendar
                missionOnly
                missions={selectedStatusMissions.length > 0 ? selectedStatusMissions : allMissionRows}
                users={users}
                onOpenMission={onOpenMission}
                onCreateMissionAtDate={(date) => openCreateMission(date)}
              />
            </div>
          )}
        </>
      )}
      {isCreatingMission && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-5xl mx-auto py-6">
            <MissionCreator
              users={users}
              initialStartDate={createStartDate}
              onCancel={() => setIsCreatingMission(false)}
              onCreated={() => setIsCreatingMission(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionsManager;
