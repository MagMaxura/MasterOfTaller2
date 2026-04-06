import React, { useState, useMemo } from 'react';
import { Mission, User, MissionStatus, PayrollEvent, PayrollEventType, VacationRequest, Holiday } from '../types';
import { CalendarIcon, TasksIcon, ClockIcon, PlusIcon } from './Icons';

interface MissionLayout {
  mission: Mission;
  track: number; // The vertical lane (0, 1, 2...)
  startCol: number; // Grid column start (1-7 for Monday-Sunday)
  span: number; // How many columns it spans in the current week
  isStart: boolean; // Is this the first segment of the mission?
  isEnd: boolean; // Is this the last segment of the mission?
}

interface MissionBarProps {
  layout: MissionLayout;
  users: User[];
  today: Date;
  onClick: () => void;
}

const MissionBar: React.FC<MissionBarProps> = ({ layout, users, today, onClick }) => {
  const { mission, startCol, span, isStart, isEnd } = layout;

  const startDate = new Date(mission.startDate + 'T00:00:00');
  const deadline = new Date(mission.deadline + 'T00:00:00');

  // --- Calculate Progress ---
  let progress = 0;
  let bgColor = 'bg-brand-blue/50';
  let progressColor = 'bg-brand-blue';

  if (mission.status === MissionStatus.COMPLETED) {
    progress = 100;
    progressColor = 'bg-brand-green';
    bgColor = 'bg-brand-green/30';
  } else if (today > deadline) {
    progress = 100;
    progressColor = 'bg-brand-red';
    bgColor = 'bg-brand-red/30';
  } else if (today >= startDate) {
    const totalDuration = deadline.getTime() - startDate.getTime();
    const elapsedDuration = today.getTime() - startDate.getTime();
    progress = totalDuration > 0 ? (elapsedDuration / totalDuration) * 100 : 0;
  }

  const barStyle: React.CSSProperties = {
    gridColumnStart: startCol,
    gridColumnEnd: `span ${span}`,
    marginTop: `${layout.track * 2.25}rem` // 2rem height + 0.25rem margin
  };

  const startRadiusClass = isStart ? 'rounded-l-lg' : '';
  const endRadiusClass = isEnd ? 'rounded-r-lg' : '';

  const userNames = users.map(u => u.name).join(', ');

  return (
    <div
      style={barStyle}
      className={`absolute w-full h-8 px-2 ${startRadiusClass} ${endRadiusClass} ${bgColor} flex items-center cursor-pointer group`}
      onClick={onClick}
      title={`${mission.title}\nAsignado a: ${userNames || 'N/A'}\nPlazo: ${mission.startDate} a ${mission.deadline}`}
    >
      <div className={`absolute top-0 left-0 h-full ${startRadiusClass} ${endRadiusClass} ${progressColor} opacity-70 group-hover:opacity-100 transition-all`} style={{ width: `${progress}%` }}></div>
      <div className="relative flex items-center gap-2 w-full truncate text-white">
        <div className="flex -space-x-2 overflow-hidden">
          {users.slice(0, 3).map(user => (
            <img key={user.id} src={user.avatar} alt={user.name} className="inline-block h-5 w-5 rounded-full ring-2 ring-brand-secondary" />
          ))}
        </div>
        <p className="truncate text-xs font-semibold">{mission.title}</p>
      </div>
    </div>
  );
};

interface MissionCalendarProps {
  missions: Mission[];
  users: User[];
  payrollEvents?: PayrollEvent[];
  vacationRequests?: VacationRequest[];
  holidays?: Holiday[];
  onOpenMission?: (mission: Mission) => void;
  onEditPayrollEvent?: (event: PayrollEvent) => void;
  onRequestVacation?: () => void;
  onAddHoliday?: (date: string, description: string) => void;
  onDeleteHoliday?: (id: string) => void;
}

const MissionCalendar: React.FC<MissionCalendarProps> = ({ missions, users, payrollEvents = [], vacationRequests = [], holidays = [], onOpenMission, onEditPayrollEvent, onRequestVacation, onAddHoliday, onDeleteHoliday }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'missions' | 'attendance'>('missions');

  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { weeks, year, month } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 6=Sat
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 0=Mon, 6=Sun

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startOffset);

    const weeksArray: Date[][] = [];
    let currentWeek: Date[] = [];

    for (let i = 0; i < 42; i++) { // 6 weeks grid
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    }
    return { weeks: weeksArray, year, month };
  }, [currentDate]);

  const weeksLayout = useMemo(() => {
    return weeks.map(week => {
      const weekStart = week[0];
      const weekEnd = week[6];
      const weekMissions: MissionLayout[] = [];

      const relevantMissions = missions.filter(m => {
        const missionStart = new Date(m.startDate + 'T00:00:00');
        const missionEnd = new Date(m.deadline + 'T00:00:00');
        return missionStart <= weekEnd && missionEnd >= weekStart;
      }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      const lanes: (Date | null)[][] = []; // [ [mission_end_date, ...], [mission_end_date, ...] ]

      relevantMissions.forEach(mission => {
        const missionStart = new Date(mission.startDate + 'T00:00:00');
        const missionEnd = new Date(mission.deadline + 'T00:00:00');

        let assignedTrack = -1;

        for (let i = 0; i < lanes.length; i++) {
          const lane = lanes[i];
          let isFree = true;
          for (const occupiedUntil of lane) {
            if (occupiedUntil && missionStart <= occupiedUntil) {
              isFree = false;
              break;
            }
          }
          if (isFree) {
            assignedTrack = i;
            break;
          }
        }

        if (assignedTrack === -1) {
          lanes.push([]);
          assignedTrack = lanes.length - 1;
        }

        lanes[assignedTrack].push(missionEnd);

        // Calculate start col and span for this specific week
        const startDay = missionStart < weekStart ? weekStart : missionStart;
        const endDay = missionEnd > weekEnd ? weekEnd : missionEnd;

        const startCol = startDay.getDay() === 0 ? 7 : startDay.getDay(); // Mon=1, Sun=7
        const endCol = endDay.getDay() === 0 ? 7 : endDay.getDay();

        const span = endCol - startCol + 1;

        if (span > 0) {
          weekMissions.push({
            mission,
            track: assignedTrack,
            startCol,
            span,
            isStart: missionStart >= weekStart,
            isEnd: missionEnd <= weekEnd
          });
        }
      });
      return weekMissions;
    });
  }, [weeks, missions]);

  const vacationLayout = useMemo(() => {
    return weeks.map(week => {
      const weekStart = week[0];
      const weekEnd = week[6];
      const weekVacations: any[] = [];

      const relevantVacations = vacationRequests.filter(v => {
        const vStart = new Date(v.start_date + 'T00:00:00');
        const vEnd = new Date(v.end_date + 'T00:00:00');
        return vStart <= weekEnd && vEnd >= weekStart;
      });

      const userLanes: Record<string, number> = {}; // userId -> lane
      let nextLane = 0;

      relevantVacations.forEach(vac => {
        const vStart = new Date(vac.start_date + 'T00:00:00');
        const vEnd = new Date(vac.end_date + 'T00:00:00');

        if (userLanes[vac.user_id] === undefined) {
          userLanes[vac.user_id] = nextLane++;
        }

        const startDay = vStart < weekStart ? weekStart : vStart;
        const endDay = vEnd > weekEnd ? weekEnd : vEnd;

        const startCol = startDay.getDay() === 0 ? 7 : startDay.getDay();
        const endCol = endDay.getDay() === 0 ? 7 : endDay.getDay();
        const span = endCol - startCol + 1;

        if (span > 0) {
          weekVacations.push({
            vacation: vac,
            track: userLanes[vac.user_id],
            startCol,
            span,
            isStart: vStart >= weekStart,
            isEnd: vEnd <= weekEnd
          });
        }
      });
      return weekVacations;
    });
  }, [weeks, vacationRequests]);


  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const getEventStyle = (type: PayrollEventType) => {
    switch (type) {
      case PayrollEventType.ABSENCE: return 'bg-brand-red text-white';
      case PayrollEventType.SICK_LEAVE: return 'bg-purple-500 text-white';
      case PayrollEventType.VACATION: return 'bg-blue-400 text-white';
      case PayrollEventType.PERMITTED_LEAVE: return 'bg-teal-500 text-white';
      case PayrollEventType.TARDINESS:
      case PayrollEventType.EARLY_DEPARTURE: return 'bg-brand-orange text-white';
      case PayrollEventType.OVERTIME: return 'bg-brand-green text-brand-primary';
      case PayrollEventType.BONUS: return 'bg-brand-gold text-brand-primary';
      case PayrollEventType.PENALTY: return 'bg-red-800 text-white';
      default: return 'bg-brand-accent text-white';
    }
  };

  const getEventIcon = (type: PayrollEventType) => {
    switch (type) {
      case PayrollEventType.ABSENCE: return '❌';
      case PayrollEventType.SICK_LEAVE: return '🤢';
      case PayrollEventType.VACATION: return '🏖️';
      case PayrollEventType.PERMITTED_LEAVE: return '📅';
      case PayrollEventType.TARDINESS: return '⏰';
      case PayrollEventType.EARLY_DEPARTURE: return '🏃';
      case PayrollEventType.OVERTIME: return '💪';
      case PayrollEventType.BONUS: return '💰';
      case PayrollEventType.PENALTY: return '⚠️';
      default: return '•';
    }
  };
  
  const handleDayClick = (dateStr: string) => {
    if (viewMode === 'attendance' && onAddHoliday) {
      const description = window.prompt("Ingrese el nombre del feriado:");
      if (description) onAddHoliday(dateStr, description);
    }
  };

  return (
    <div className="bg-brand-secondary p-4 rounded-lg shadow-xl select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex bg-brand-dark/20 p-1 rounded-xl border border-brand-light/10">
          <button
            onClick={() => setViewMode('missions')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'missions' ? 'bg-brand-blue text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
          >
            <TasksIcon className="w-4 h-4" />
            <span>Misiones</span>
          </button>
          <button
            onClick={() => setViewMode('attendance')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'attendance' ? 'bg-brand-blue text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
          >
            <ClockIcon className="w-4 h-4" />
            <span>Asistencia / Vacaciones</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={goToPrevMonth} className="p-2 rounded-full hover:bg-brand-accent text-brand-light hover:text-white transition-colors">&lt;</button>
          <h3 className="text-xl font-bold min-w-[150px] text-center">
            {new Date(year, month).toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
          </h3>
          <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-brand-accent text-brand-light hover:text-white transition-colors">&gt;</button>
        </div>
        {onRequestVacation && (
          <button
            onClick={onRequestVacation}
            className="flex items-center gap-2 bg-brand-green text-brand-dark px-4 py-2 rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-lg active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Solicitar Vacaciones</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-7">
        {daysOfWeek.map(day => (
          <div key={day} className="font-bold text-center p-2 border-b-2 border-brand-accent text-brand-light">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 relative">
        {weeks.flat().map((day, index) => {
          const dayStr = day.toISOString().split('T')[0];
          const dayEvents = payrollEvents.filter(e => e.fecha_evento === dayStr);

          return (
              <div 
                key={index} 
                className={`border-r border-b border-brand-accent/50 p-2 min-h-[120px] relative transition-colors ${viewMode === 'attendance' && onAddHoliday ? 'hover:bg-brand-accent/30 cursor-pointer' : ''}`}
                onClick={() => handleDayClick(dayStr)}
              >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-bold ${day.getMonth() !== month ? 'text-brand-accent' : ''} ${day.toDateString() === today.toDateString() ? 'bg-brand-blue text-white rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
                  {day.getDate()}
                </span>
                {holidays.filter(h => h.date === dayStr).map(h => (
                  <div 
                    key={h.id} 
                    className="w-6 h-6 flex items-center justify-center bg-brand-gold rounded-full text-[12px] shadow-lg animate-bounce" 
                    title={`Feriado: ${h.description}`}
                    onClick={(e) => {
                      if (onDeleteHoliday) {
                        e.stopPropagation();
                        if (window.confirm(`¿Eliminar feriado ${h.description}?`)) onDeleteHoliday(h.id);
                      }
                    }}
                  >
                    🚩
                  </div>
                ))}
              </div>

              {/* Render Payroll Events for this day */}
              <div className="flex flex-wrap gap-1 mb-6">
                {dayEvents.map(ev => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEditPayrollEvent && onEditPayrollEvent(ev); }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] cursor-pointer shadow-sm hover:scale-110 transition-transform ${getEventStyle(ev.tipo)}`}
                    title={`${ev.tipo}: ${ev.descripcion}`}
                  >
                    {getEventIcon(ev.tipo)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {viewMode === 'missions' ? (
          weeksLayout.map((weekMissions, weekIndex) => (
            <div key={weekIndex} className="row-start-auto grid grid-cols-7 absolute w-full pointer-events-none" style={{ top: `calc(${weekIndex * 120}px + 0.5rem)` }}>
              {weekMissions.map((layout) => {
                const assignedUsers = (layout.mission.assignedTo || []).map(id => usersMap.get(id)).filter((u): u is User => !!u);
                return (
                  <div key={`${layout.mission.id}-${weekIndex}`} className="pointer-events-auto">
                    <MissionBar
                      layout={layout}
                      users={assignedUsers}
                      today={today}
                      onClick={() => onOpenMission && onOpenMission(layout.mission)}
                    />
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          vacationLayout.map((weekVacations, weekIndex) => (
            <div key={weekIndex} className="row-start-auto grid grid-cols-7 absolute w-full pointer-events-none" style={{ top: `calc(${weekIndex * 120}px + 0.5rem)` }}>
              {weekVacations.map((layout) => {
                const user = usersMap.get(layout.vacation.user_id);
                const isApproved = layout.vacation.status === 'APROBADA';
                const colorClass = isApproved ? 'bg-brand-green/40' : 'bg-brand-orange/30';
                const borderColor = isApproved ? 'border-brand-green' : 'border-brand-orange';

                return (
                  <div
                    key={`${layout.vacation.id}-${weekIndex}`}
                    style={{
                      gridColumnStart: layout.startCol,
                      gridColumnEnd: `span ${layout.span}`,
                      marginTop: `${layout.track * 2.25}rem`
                    }}
                    className={`absolute w-full h-8 px-2 flex items-center gap-2 pointer-events-auto border-l-4 ${borderColor} ${colorClass} ${layout.isStart ? 'rounded-l' : ''} ${layout.isEnd ? 'rounded-r' : ''}`}
                    title={`Vacaciones: ${user?.name || 'N/A'}\nEstado: ${layout.vacation.status}\nMotivo: ${layout.vacation.reason || 'Sin motivo'}`}
                  >
                    <img src={user?.avatar} alt="" className="w-5 h-5 rounded-full border border-white/20" />
                    <span className="text-[10px] font-bold text-white truncate">
                      {user?.name} {layout.vacation.status === 'PENDIENTE' ? '(P)' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MissionCalendar;