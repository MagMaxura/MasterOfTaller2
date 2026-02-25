import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { attendanceService, AttendanceUser, AttendanceRecord, Holiday } from '../../../services/attendanceService';
import { CalendarIcon, MapPinIcon, ClockIcon, BadgeIcon } from '../../Icons';

const AttendanceModal: React.FC<{ user: User; onClose: () => void; }> = ({ user, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState<{
        attendanceUser: AttendanceUser | null;
        logs: AttendanceRecord[];
        holidays: Holiday[];
    }>({ attendanceUser: null, logs: [], holidays: [] });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // El email de MasterOfTaller2 se usa para machear con la base de asistencia
                const data = await attendanceService.getFullAttendanceSummary(user.email);
                if (data) {
                    setAttendanceData({
                        attendanceUser: data.user,
                        logs: data.logs,
                        holidays: data.holidays
                    });
                }
            } catch (error) {
                console.error("Error fetching integrated attendance:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.email]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-[2rem] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-brand-accent">
                {/* Header */}
                <div className="p-8 border-b border-brand-accent flex justify-between items-center bg-brand-secondary/30">
                    <div className="flex items-center gap-4">
                        <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl border-2 border-brand-blue shadow-lg object-cover" />
                        <div>
                            <h3 className="text-2xl font-black text-brand-highlight tracking-tight">Asistencia y Tiempos</h3>
                            <p className="text-sm text-brand-light font-bold uppercase tracking-widest">{user.name} • {user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-brand-accent text-brand-light hover:text-brand-red hover:border-brand-red transition-all shadow-sm text-2xl group">
                        <span className="group-hover:scale-125 transition-transform">&times;</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-brand-secondary/10 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-brand-light font-black uppercase tracking-widest animate-pulse">Sincronizando con base externa...</p>
                        </div>
                    ) : !attendanceData.attendanceUser ? (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-brand-accent">
                            <div className="w-20 h-20 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-6">
                                <MapPinIcon className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-black text-brand-highlight mb-2">Usuario no vinculado</h4>
                            <p className="text-brand-light max-w-sm mx-auto">No se encontró un registro de asistencia para <strong>{user.email}</strong> en la base de datos externa.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-accent group hover:border-brand-blue transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-brand-blue/10 rounded-xl text-brand-blue">
                                            <ClockIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-brand-light tracking-widest">Horario Base</span>
                                    </div>
                                    <p className="text-xl font-black text-brand-highlight">
                                        {attendanceData.attendanceUser.start_time} - {attendanceData.attendanceUser.end_time}
                                    </p>
                                    <p className="text-xs font-bold text-brand-light mt-1">{attendanceData.attendanceUser.daily_hours}h diarios ({attendanceData.attendanceUser.schedule_type})</p>
                                </div>

                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-accent group hover:border-brand-green transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-brand-green/10 rounded-xl text-brand-green">
                                            <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-brand-light tracking-widest">Vacaciones</span>
                                    </div>
                                    {attendanceData.attendanceUser.vacation_start_date ? (
                                        <div className="flex flex-col">
                                            <p className="text-lg font-black text-brand-highlight leading-tight">
                                                {new Date(attendanceData.attendanceUser.vacation_start_date).toLocaleDateString()}
                                            </p>
                                            <p className="text-[10px] font-black uppercase text-brand-light">al {new Date(attendanceData.attendanceUser.vacation_end_date!).toLocaleDateString()}</p>
                                        </div>
                                    ) : (
                                        <p className="text-xl font-black text-brand-light italic">Sin programar</p>
                                    )}
                                </div>

                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-accent group hover:border-brand-orange transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange">
                                            <BadgeIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-brand-light tracking-widest">Feriados Próximos</span>
                                    </div>
                                    <p className="text-xl font-black text-brand-highlight">
                                        {attendanceData.holidays.length} Registrados
                                    </p>
                                    <p className="text-xs font-bold text-brand-light mt-1">Sincronizado globalmente</p>
                                </div>
                            </div>

                            {/* Access Logs Table */}
                            <div className="bg-white rounded-3xl shadow-sm border border-brand-accent overflow-hidden">
                                <div className="px-6 py-4 bg-brand-secondary/50 border-b border-brand-accent flex justify-between items-center">
                                    <h4 className="text-sm font-black text-brand-highlight uppercase tracking-widest">Registros Recientes (Entradas/Salidas)</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] text-brand-light uppercase font-black tracking-widest bg-brand-secondary/20">
                                                <th className="px-6 py-3">Evento</th>
                                                <th className="px-6 py-3">Fecha y Hora</th>
                                                <th className="px-6 py-3 text-center">Tardanza</th>
                                                <th className="px-6 py-3 text-center">Extra</th>
                                                <th className="px-6 py-3">Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-accent">
                                            {attendanceData.logs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-10 text-center text-brand-light italic">No hay registros de acceso recientes.</td>
                                                </tr>
                                            ) : (
                                                attendanceData.logs.map(log => (
                                                    <tr key={log.id} className="hover:bg-brand-secondary/30 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${log.type === 'IN' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-blue/10 text-brand-blue'
                                                                }`}>
                                                                {log.type === 'IN' ? 'Entrada' : 'Salida'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-brand-highlight">
                                                            {formatDate(log.timestamp)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {log.tardiness_hours && log.tardiness_hours > 0 ? (
                                                                <span className="text-brand-red font-black">+{log.tardiness_hours}h</span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {log.overtime_hours && log.overtime_hours > 0 ? (
                                                                <span className="text-brand-green font-black">+{log.overtime_hours}h</span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-brand-light italic">
                                                            {log.notes || '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceModal;
