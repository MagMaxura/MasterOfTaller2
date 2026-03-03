import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { VacationRequest } from '../../../types';
import ProgressBar from '../../common/ProgressBar';

const VacationPanel: React.FC = () => {
    const { currentUser, vacationRequests, requestVacation, deleteVacationRequest } = useData();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!currentUser) return null;

    const userRequests = vacationRequests.filter(r => r.user_id === currentUser.id);
    const totalDays = currentUser.vacation_total_days || 0;
    const remainingDays = currentUser.vacation_remaining_days || 0;
    const usedDays = totalDays - remainingDays;
    const usagePercentage = totalDays > 0 ? (usedDays / totalDays) * 100 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) return;

        setIsSubmitting(true);
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            await requestVacation({
                user_id: currentUser.id,
                start_date: startDate,
                end_date: endDate,
                days_count: daysCount,
                reason: reason || null,
                reviewed_by: null,
                reviewed_at: null
            });

            setStartDate('');
            setEndDate('');
            setReason('');
        } catch (error) {
            console.error("Error al solicitar vacaciones:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg space-y-8">
            <h4 className="text-xl font-bold text-center">Gestión de Vacaciones</h4>

            {/* Saldo de Vacaciones */}
            <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-light/10">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-brand-light">Días Utilizados</span>
                    <span className="text-xl font-bold text-brand-green">{usedDays} / {totalDays}</span>
                </div>
                <ProgressBar value={usagePercentage} max={100} colorClass="bg-brand-green" />
                <p className="text-sm text-right mt-2 text-brand-light">
                    Quedan <span className="text-brand-green font-bold">{remainingDays}</span> días disponibles
                </p>
            </div>

            {/* Formulario de Solicitud */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <h5 className="font-semibold text-brand-light border-b border-brand-light/10 pb-2">Nueva Solicitud</h5>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-brand-light uppercase tracking-wider">Desde</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="w-full bg-brand-dark border border-brand-light/20 rounded p-2 text-sm focus:border-brand-green focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-brand-light uppercase tracking-wider">Hasta</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            className="w-full bg-brand-dark border border-brand-light/20 rounded p-2 text-sm focus:border-brand-green focus:outline-none transition-colors"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-brand-light uppercase tracking-wider">Motivo (Opcional)</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ej: Trámites personales, viaje, etc."
                        className="w-full bg-brand-dark border border-brand-light/20 rounded p-2 text-sm focus:border-brand-green focus:outline-none transition-colors h-20 resize-none"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting || !remainingDays}
                    className={`w-full py-2 rounded font-bold transition-all ${isSubmitting || !remainingDays
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-brand-green text-brand-dark hover:brightness-110 active:scale-95'
                        }`}
                >
                    {isSubmitting ? 'Enviando...' : remainingDays > 0 ? 'Solicitar Vacaciones' : 'Sin saldo disponible'}
                </button>
            </form>

            {/* Historial de Solicitudes */}
            <div className="space-y-4">
                <h5 className="font-semibold text-brand-light border-b border-brand-light/10 pb-2">Historial de Solicitudes</h5>
                <div className="max-h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-brand-green scrollbar-track-brand-dark">
                    {userRequests.length > 0 ? (
                        userRequests.map((req) => (
                            <div key={req.id} className="bg-brand-dark/40 p-3 rounded border border-brand-light/5 flex flex-col gap-1 relative group">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold">
                                        {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${req.status === 'APROBADA' ? 'bg-green-500/20 text-green-400' :
                                            req.status === 'RECHAZADA' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {req.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-brand-light">
                                    <span>{req.days_count} {req.days_count === 1 ? 'día' : 'días'}</span>
                                    {req.status === 'PENDIENTE' && (
                                        <button
                                            onClick={() => deleteVacationRequest(req.id)}
                                            className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                                {req.reason && <p className="text-[11px] italic text-brand-light mt-1 truncate">"{req.reason}"</p>}
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-center text-brand-light py-4 italic">No tienes solicitudes registradas.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VacationPanel;
