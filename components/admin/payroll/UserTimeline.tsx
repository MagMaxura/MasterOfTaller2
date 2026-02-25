import React, { useMemo } from 'react';
import { PayrollEvent, PayrollEventType, AttendanceSummary } from '../../../types';

interface UserTimelineProps {
    periodStart: string;
    periodEnd: string;
    events: PayrollEvent[];
    attendanceHistory?: AttendanceSummary[];
    onDayClick?: (date: Date) => void;
    onEventClick?: (event: PayrollEvent) => void;
}

const UserTimeline: React.FC<UserTimelineProps> = ({ periodStart, periodEnd, events, attendanceHistory = [], onDayClick, onEventClick }) => {

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
        return events.filter(e => e.fecha_evento === dateStr);
    };

    const getAttendanceForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return attendanceHistory.find(a => a.date === dateStr);
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

    const getDayStyle = (events: PayrollEvent[], isWeekend: boolean, attendance?: AttendanceSummary) => {
        if (events.length === 0 && !attendance) {
            return isWeekend
                ? 'bg-brand-secondary/50 border-brand-accent/30'
                : 'bg-brand-secondary border-brand-accent';
        }

        let hasDeduction = false;
        let hasAddition = false;

        events.forEach(e => {
            if ([PayrollEventType.ABSENCE, PayrollEventType.TARDINESS, PayrollEventType.EARLY_DEPARTURE, PayrollEventType.PENALTY].includes(e.tipo)) {
                hasDeduction = true;
            }
            if ([PayrollEventType.OVERTIME, PayrollEventType.BONUS].includes(e.tipo)) {
                hasAddition = true;
            }
        });

        if (hasDeduction && hasAddition) return 'bg-brand-primary border-brand-accent'; // Mixed
        if (hasDeduction) return 'bg-brand-red/10 border-brand-red/30';
        if (hasAddition) return 'bg-brand-green/10 border-brand-green/30';

        if (attendance && attendance.totalHours > 0) return 'bg-brand-blue/5 border-brand-blue/20';

        return 'bg-brand-secondary border-brand-accent';
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

    const formatTime = (isoString?: string) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <div className="w-full overflow-x-auto pb-4">
            <h4 className="text-sm font-bold text-brand-light mb-2">Línea de Tiempo del Periodo</h4>
            <div className="flex gap-2 min-w-max">
                {days.map((date, index) => {
                    const dayEvents = getEventForDay(date);
                    const attendance = getAttendanceForDay(date);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                    return (
                        <div
                            key={index}
                            onClick={() => onDayClick && onDayClick(date)}
                            className={`flex flex-col items-center min-w-[4.5rem] p-2 rounded border cursor-pointer hover:bg-brand-primary/80 transition-colors ${getDayStyle(dayEvents, isWeekend, attendance)}`}
                        >
                            <span className="text-xs text-brand-light mb-1">{date.getDate()}/{date.getMonth() + 1}</span>
                            <span className="text-[10px] uppercase text-brand-light/50 mb-1">{date.toLocaleDateString('es-AR', { weekday: 'short' })}</span>

                            {/* Attendance Info */}
                            {attendance && (
                                <div className="text-[9px] text-center mb-1 leading-tight text-brand-blue font-bold">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className={attendance.checkIn ? 'text-brand-green' : 'text-brand-red/50'}>•</span>
                                        <span>{attendance.totalHours.toFixed(1)}h</span>
                                        <span className={attendance.checkOut ? 'text-brand-green' : 'text-brand-red/50'}>•</span>
                                    </div>
                                    <div className="text-brand-light/70 font-normal">
                                        {formatTime(attendance.checkIn)}|{formatTime(attendance.checkOut)}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1 mt-1">
                                {dayEvents.length > 0 ? (
                                    dayEvents.map(ev => (
                                        <div
                                            key={ev.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick && onEventClick(ev);
                                            }}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm hover:scale-110 transition-transform ${getEventStyle(ev.tipo)}`}
                                            title={`${ev.tipo}: ${ev.descripcion}`}
                                        >
                                            {getEventIcon(ev.tipo)}
                                        </div>
                                    ))
                                ) : !attendance && (
                                    <div className="w-6 h-6 rounded-full bg-white/5 mx-auto"></div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-2 flex gap-4 text-[10px] text-brand-light italic">
                <div className="flex items-center gap-1"><span className="text-brand-green">•</span> Fichada completa</div>
                <div className="flex items-center gap-1"><span className="text-brand-red/50">•</span> Fichada faltante (Deducción automática)</div>
            </div>
        </div>
    );
};

export default UserTimeline;
