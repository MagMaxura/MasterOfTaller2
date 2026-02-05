import React, { useMemo } from 'react';
import { PayrollEvent, PayrollEventType } from '../../../types';

interface UserTimelineProps {
    periodStart: string;
    periodEnd: string;
    events: PayrollEvent[];
    onDayClick?: (date: Date) => void;
}

const UserTimeline: React.FC<UserTimelineProps> = ({ periodStart, periodEnd, events, onDayClick }) => {

    // Generate array of days for the period
    const days = useMemo(() => {
        const start = new Date(periodStart + 'T00:00:00');
        const end = new Date(periodEnd + 'T00:00:00');
        const dayList = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dayList.push(new Date(d));
        }
        return dayList;
    }, [periodStart, periodEnd]);

    // Helper to find event for a specific day
    const getEventForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        // We might have multiple events per day, for now we pick the most critical one or list them
        // Criticality: ABSENCE > SICK > TARDINESS > EXTAS ...
        return events.filter(e => e.fecha_evento === dateStr);
    };

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
            case PayrollEventType.LOAN: return 'bg-gray-500 text-white';
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

    return (
        <div className="w-full overflow-x-auto pb-4">
            <h4 className="text-sm font-bold text-brand-light mb-2">Línea de Tiempo del Periodo</h4>
            <div className="flex gap-2 min-w-max">
                {days.map((date, index) => {
                    const dayEvents = getEventForDay(date);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0=Sun, 6=Sat

                    return (
                        <div
                            key={index}
                            onClick={() => onDayClick && onDayClick(date)}
                            className={`flex flex-col items-center min-w-[3rem] p-2 rounded border cursor-pointer hover:bg-brand-primary/80 transition-colors ${isWeekend ? 'bg-brand-secondary/50 border-brand-accent/30' : 'bg-brand-secondary border-brand-accent'}`}
                        >
                            <span className="text-xs text-brand-light mb-1">{date.getDate()}/{date.getMonth() + 1}</span>
                            <span className="text-[10px] uppercase text-brand-light/50 mb-2">{date.toLocaleDateString('es-AR', { weekday: 'short' })}</span>

                            <div className="space-y-1">
                                {dayEvents.length > 0 ? (
                                    dayEvents.map(ev => (
                                        <div key={ev.id} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm ${getEventStyle(ev.tipo)}`} title={`${ev.tipo}: ${ev.descripcion}`}>
                                            {getEventIcon(ev.tipo)}
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-white/5 mx-auto group-hover:bg-white/10 transition-colors"></div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserTimeline;
