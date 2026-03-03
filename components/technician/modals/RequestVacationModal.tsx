import React, { useState } from 'react';
import { User } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { XIcon } from '../../Icons';

interface RequestVacationModalProps {
    user: User;
    onClose: () => void;
}

const RequestVacationModal: React.FC<RequestVacationModalProps> = ({ user, onClose }) => {
    const { requestVacation } = useData();
    const { showToast } = useToast();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) return;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            showToast("La fecha de fin no puede ser anterior a la de inicio", 'error');
            return;
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (daysCount > (user.vacation_remaining_days || 0)) {
            showToast("No tienes suficientes días disponibles", 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await requestVacation({
                user_id: user.id,
                start_date: startDate,
                end_date: endDate,
                days_count: daysCount,
                reason: reason || null,
            });
            showToast("Solicitud enviada con éxito", 'success');
            onClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al enviar solicitud", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-brand-highlight/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-brand-accent">
                <div className="bg-brand-secondary px-8 py-6 border-b border-brand-accent flex justify-between items-center">
                    <h4 className="text-xl font-black text-brand-highlight tracking-tight text-brand-blue">Solicitar Vacaciones</h4>
                    <button onClick={onClose} className="p-2 hover:bg-brand-accent rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-brand-light" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Fecha de Inicio</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Fecha de Fin</label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Motivo (Opcional)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-blue outline-none transition-all resize-none"
                            placeholder="Ej: Trámites personales, Viaje familiar..."
                            rows={3}
                        />
                    </div>

                    <div className="bg-brand-blue/5 p-4 rounded-2xl border border-brand-blue/10">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-light">
                            <span>Días Disponibles:</span>
                            <span className="text-brand-blue">{user.vacation_remaining_days || 0}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border border-brand-accent text-brand-light hover:bg-brand-secondary transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-brand-blue text-white shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestVacationModal;
