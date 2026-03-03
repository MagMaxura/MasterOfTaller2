import React, { useState, useEffect } from 'react';
import { User, UserSchedule } from '../../../types';
import { ClockIcon, CalendarIcon, PlusIcon } from '../../Icons';

interface ScheduleModalProps {
    user: User;
    schedule: UserSchedule | undefined;
    onClose: () => void;
    onSave: (userId: string, data: Partial<UserSchedule>) => Promise<void>;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ user, schedule, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<UserSchedule>>({
        schedule_type: 'FLEXIBLE',
        start_time: '08:00:00',
        end_time: '17:00:00',
        daily_hours: 8,
        tolerance_minutes: 15,
        exit_tolerance_minutes: 5,
        vacation_start_date: null,
        vacation_end_date: null,
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (schedule) {
            setFormData({
                schedule_type: schedule.schedule_type || 'FLEXIBLE',
                start_time: schedule.start_time || '08:00:00',
                end_time: schedule.end_time || '17:00:00',
                daily_hours: schedule.daily_hours || 8,
                tolerance_minutes: schedule.tolerance_minutes ?? 15,
                exit_tolerance_minutes: schedule.exit_tolerance_minutes ?? 5,
                vacation_start_date: schedule.vacation_start_date,
                vacation_end_date: schedule.vacation_end_date,
            });
        }
    }, [schedule]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSave(user.id, formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-brand-secondary w-full max-w-md rounded-2xl shadow-2xl border border-brand-accent/30 overflow-hidden animation-zoom-in">
                <div className="p-4 border-b border-brand-accent/50 flex justify-between items-center bg-brand-primary/50">
                    <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-brand-blue" />
                        <h3 className="font-bold text-lg">Configurar Horario: {user.name}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-brand-light">
                        <span className="text-xl px-1">×</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* TIPO DE HORARIO */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-brand-blue uppercase tracking-wider block">Tipo de Régimen</label>
                        <div className="grid grid-cols-2 gap-2 bg-brand-primary p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, schedule_type: 'FIJO' })}
                                className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.schedule_type === 'FIJO' ? 'bg-brand-blue text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
                            >
                                Horario Fijo
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, schedule_type: 'FLEXIBLE' })}
                                className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.schedule_type === 'FLEXIBLE' ? 'bg-brand-blue text-white shadow-lg' : 'text-brand-light hover:text-white'}`}
                            >
                                Horas Libres
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* START TIME */}
                        {formData.schedule_type === 'FIJO' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-brand-light uppercase block">Entrada</label>
                                <div className="relative">
                                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue w-4 h-4" />
                                    <input
                                        type="time"
                                        step="1"
                                        value={formData.start_time || ''}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-lg py-2 pl-10 pr-3 text-sm focus:border-brand-blue outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* END TIME */}
                        {formData.schedule_type === 'FIJO' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-brand-light uppercase block">Salida</label>
                                <div className="relative">
                                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue w-4 h-4" />
                                    <input
                                        type="time"
                                        step="1"
                                        value={formData.end_time || ''}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-lg py-2 pl-10 pr-3 text-sm focus:border-brand-blue outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* DAILY HOURS */}
                        <div className={`space-y-2 ${formData.schedule_type === 'FLEXIBLE' ? 'col-span-2' : ''}`}>
                            <label className="text-xs font-bold text-brand-light uppercase block">Horas Diarias</label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.daily_hours || 0}
                                onChange={(e) => setFormData({ ...formData, daily_hours: parseFloat(e.target.value) })}
                                className="w-full bg-brand-primary border border-brand-accent/50 rounded-lg py-2 px-3 text-sm focus:border-brand-blue outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* TOLERANCES */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-brand-primary/30 rounded-xl border border-brand-accent/20">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-brand-light uppercase block">Tolerancia Entrada (min)</label>
                            <input
                                type="number"
                                value={formData.tolerance_minutes || 0}
                                onChange={(e) => setFormData({ ...formData, tolerance_minutes: parseInt(e.target.value) })}
                                className="w-full bg-brand-primary border border-brand-accent/50 rounded-lg py-1 px-3 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-brand-light uppercase block">Tolerancia Salida (min)</label>
                            <input
                                type="number"
                                value={formData.exit_tolerance_minutes || 0}
                                onChange={(e) => setFormData({ ...formData, exit_tolerance_minutes: parseInt(e.target.value) })}
                                className="w-full bg-brand-primary border border-brand-accent/50 rounded-lg py-1 px-3 text-sm"
                            />
                        </div>
                    </div>

                    {/* VACATIONS */}
                    <div className="space-y-3 pt-2 border-t border-brand-accent/30">
                        <div className="flex items-center gap-2 text-brand-orange">
                            <CalendarIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Periodo de Vacaciones / Licencia</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-brand-light uppercase block">Desde</label>
                                <input
                                    type="date"
                                    value={formData.vacation_start_date || ''}
                                    onChange={(e) => setFormData({ ...formData, vacation_start_date: e.target.value || null })}
                                    className="w-full bg-brand-primary border border-brand-accent/50 rounded-lg py-2 px-3 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-brand-light uppercase block">Hasta</label>
                                <input
                                    type="date"
                                    value={formData.vacation_end_date || ''}
                                    onChange={(e) => setFormData({ ...formData, vacation_end_date: e.target.value || null })}
                                    className="w-full bg-brand-primary border border-brand-accent/50 rounded-lg py-2 px-3 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-brand-light hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] bg-brand-blue hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20 transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <PlusIcon className="w-5 h-5" />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleModal;
