import React, { useMemo } from 'react';
import { Mission, MissionStatus, User } from '../../../types';

interface MissionsGanttViewProps {
  missions: Mission[];
  users: User[];
  onOpenMission?: (mission: Mission) => void;
  onCreateMission?: () => void;
}

const STATUS_STYLES: Record<MissionStatus, string> = {
  [MissionStatus.PENDING]: 'bg-brand-light/60 border-brand-light text-slate-900',
  [MissionStatus.IN_PROGRESS]: 'bg-brand-blue/70 border-brand-blue text-white',
  [MissionStatus.COMPLETED]: 'bg-brand-green/70 border-brand-green text-slate-900',
  [MissionStatus.REQUESTED]: 'bg-brand-orange/70 border-brand-orange text-slate-900'
};

const dayDiff = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / 86400000);

const MissionsGanttView: React.FC<MissionsGanttViewProps> = ({ missions, users, onOpenMission, onCreateMission }) => {
  const usersMap = useMemo(() => new Map(users.map(user => [user.id, user])), [users]);

  const { orderedMissions, timelineStart, timelineEnd, totalDays, monthMarkers } = useMemo(() => {
    const missionPool = missions.slice().sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    if (missionPool.length === 0) {
      return {
        orderedMissions: [] as Mission[],
        timelineStart: new Date(),
        timelineEnd: new Date(),
        totalDays: 1,
        monthMarkers: [] as Date[]
      };
    }

    const minStart = new Date(Math.min(...missionPool.map(m => new Date(`${m.startDate}T00:00:00`).getTime())));
    const maxEnd = new Date(Math.max(...missionPool.map(m => new Date(`${m.deadline}T00:00:00`).getTime())));
    minStart.setDate(minStart.getDate() - 2);
    maxEnd.setDate(maxEnd.getDate() + 2);

    const markers: Date[] = [];
    const marker = new Date(minStart.getFullYear(), minStart.getMonth(), 1);
    while (marker <= maxEnd) {
      markers.push(new Date(marker));
      marker.setMonth(marker.getMonth() + 1);
    }

    return {
      orderedMissions: missionPool,
      timelineStart: minStart,
      timelineEnd: maxEnd,
      totalDays: Math.max(1, dayDiff(maxEnd, minStart) + 1),
      monthMarkers: markers
    };
  }, [missions]);

  if (orderedMissions.length === 0) {
    return (
      <div
        className="p-12 border-2 border-dashed border-brand-accent rounded-3xl text-center bg-white/50 cursor-pointer hover:bg-white/70 transition-colors"
        onClick={() => onCreateMission?.()}
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-light opacity-40">Sin misiones para mostrar</span>
      </div>
    );
  }

  return (
    <div
      className="bg-white/60 border border-brand-accent rounded-3xl p-4 md:p-6 overflow-x-auto cursor-pointer"
      onDoubleClick={() => onCreateMission?.()}
    >
      <div className="min-w-[780px]">
        <div className="relative h-10 mb-4 border-b border-brand-accent/60">
          {monthMarkers.map(marker => {
            const left = (dayDiff(marker, timelineStart) / totalDays) * 100;
            return (
              <div key={marker.toISOString()} className="absolute top-0 bottom-0" style={{ left: `${Math.max(0, Math.min(100, left))}%` }}>
                <div className="h-full w-px bg-brand-accent/50"></div>
                <span className="absolute top-0 left-2 text-[10px] uppercase font-black tracking-wider text-brand-light">
                  {marker.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {orderedMissions.map(mission => {
            const start = new Date(`${mission.startDate}T00:00:00`);
            const end = new Date(`${mission.deadline}T00:00:00`);
            const left = (dayDiff(start, timelineStart) / totalDays) * 100;
            const width = ((dayDiff(end, start) + 1) / totalDays) * 100;

            const assignedUsers = (mission.assignedTo || []).map(id => usersMap.get(id)).filter((u): u is User => Boolean(u));
            const progress =
              mission.status === MissionStatus.COMPLETED
                ? 100
                : mission.status === MissionStatus.IN_PROGRESS
                  ? Math.max(5, Math.min(95, (dayDiff(new Date(), start) / Math.max(1, dayDiff(end, start))) * 100))
                  : 0;

            return (
              <button
                key={mission.id}
                type="button"
                onClick={() => onOpenMission?.(mission)}
                className="w-full text-left bg-brand-secondary/50 hover:bg-brand-secondary transition-colors rounded-2xl border border-brand-accent/60 p-3"
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-brand-highlight truncate">{mission.title}</p>
                    <p className="text-[10px] uppercase tracking-wider text-brand-light font-bold">
                      {mission.startDate} - {mission.deadline}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${STATUS_STYLES[mission.status] || STATUS_STYLES[MissionStatus.PENDING]}`}>
                    {mission.status}
                  </span>
                </div>

                <div className="relative h-5 bg-brand-accent/40 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-brand-blue/30"
                    style={{ left: `${Math.max(0, left)}%`, width: `${Math.max(2, width)}%` }}
                  >
                    <div className="h-full bg-brand-blue rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex -space-x-2">
                    {assignedUsers.slice(0, 5).map(user => (
                      <img key={user.id} src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full border-2 border-white shadow-sm" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-brand-light">{assignedUsers.length} asignado(s)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MissionsGanttView;
