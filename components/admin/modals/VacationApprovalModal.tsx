import React, { useState } from 'react';
import { User, VacationRequest } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { CalendarIcon, CheckIcon, XIcon, PlusIcon, TrashIcon } from '../../Icons';

interface VacationApprovalModalProps {
    user: User;
    onClose: () => void;
}

const VacationApprovalModal: React.FC<VacationApprovalModalProps> = ({ user: initialUser, onClose }) => {
    const { users, vacationRequests, updateVacationStatus, deleteVacationRequest, requestVacation, updateUser } = useData();
    const { showToast } = useToast();
    const [isAddingPast, setIsAddingPast] = useState(false);

    // Always use the latest data from context
    const user = users.find(u => u.id === initialUser.id) || initialUser;
    const [pastStart, setPastStart] = useState('');
    const [pastEnd, setPastEnd] = useState('');
    const [pastReason, setPastReason] = useState('Registro histórico');

    const userRequests = vacationRequests.filter(req => req.user_id === user.id);
    const pendingRequests = userRequests.filter(req => req.status === 'PENDIENTE');
    const pastRequests = userRequests.filter(req => req.status !== 'PENDIENTE');

    const handleApprove = async (requestId: string) => {
        try {
            await updateVacationStatus(requestId, 'APROBADA');
        } catch (error) {
            showToast("Error al aprobar vacaciones", "error");
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await updateVacationStatus(requestId, 'RECHAZADA');
        } catch (error) {
            showToast("Error al rechazar vacaciones", "error");
        }
    };

    const handleAddPastVacation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const start = new Date(pastStart);
            const end = new Date(pastEnd);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            // 1. Create the request as approved
            await requestVacation({
                user_id: user.id,
                start_date: pastStart,
                end_date: end.toISOString().split('T')[0],
                days_count: daysCount,
                reason: pastReason,
                status: 'APROBADA'
            });

            // Note: DataContext.requestVacation now handles the balance update 
            // when status is 'APROBADA'

            showToast("Vacaciones históricas registradas", "success");
            setIsAddingPast(false);
            setPastStart('');
            setPastEnd('');
        } catch (error) {
            showToast("Error al registrar histórico", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-brand-highlight/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-brand-accent flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-brand-secondary px-8 py-6 border-b border-brand-accent flex justify-between items-center">
                    <div>
                        <h4 className="text-xl font-black text-brand-highlight tracking-tight text-brand-blue">Gestión de Vacaciones</h4>
                        <p className="text-xs text-brand-light font-bold uppercase tracking-widest mt-1">{user.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-brand-accent rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-brand-light" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
                    {/* Resumen de Saldo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-brand-secondary/50 p-4 rounded-2xl border border-brand-accent text-center">
                            <p className="text-[10px] font-black text-brand-light uppercase tracking-[0.1em] mb-1">Días Totales</p>
                            <p className="text-2xl font-black text-brand-highlight">{user.vacation_total_days || 0}</p>
                        </div>
                        <div className="bg-brand-green/10 p-4 rounded-2xl border border-brand-green/20 text-center">
                            <p className="text-[10px] font-black text-brand-green uppercase tracking-[0.1em] mb-1">Días Restantes</p>
                            <p className="text-2xl font-black text-brand-green">{user.vacation_remaining_days || 0}</p>
                        </div>
                    </div>

                    {/* Solicitudes Pendientes */}
                    <section>
                        <h5 className="text-[11px] font-black text-brand-light uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <ClockIcon className="w-3.5 h-3.5" /> Solicitudes Pendientes
                        </h5>
                        <div className="space-y-3">
                            {pendingRequests.length > 0 ? (
                                pendingRequests.map(req => (
                                    <div key={req.id} className="bg-white p-4 rounded-2xl border border-brand-accent shadow-sm flex items-center justify-between group hover:border-brand-blue/30 transition-all">
                                        <div>
                                            <p className="font-black text-brand-highlight">
                                                {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-brand-light font-bold uppercase tracking-wider">
                                                {req.days_count} {req.days_count === 1 ? 'Día' : 'Días'} • {req.reason || 'Sin motivo'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="p-2 bg-red-100 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                title="Rechazar"
                                            >
                                                <XIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                className="p-2 bg-brand-green/20 text-brand-green rounded-xl hover:bg-brand-green hover:text-white transition-all shadow-sm"
                                                title="Aprobar"
                                            >
                                                <CheckIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-brand-light text-xs italic py-4 bg-brand-secondary/30 rounded-2xl border border-dashed border-brand-accent">
                                    No hay solicitudes pendientes.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Registro Histórico */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h5 className="text-[11px] font-black text-brand-light uppercase tracking-[0.2em] flex items-center gap-2">
                                <CalendarIcon className="w-3.5 h-3.5" /> Historial de Vacaciones
                            </h5>
                            <button
                                onClick={() => setIsAddingPast(!isAddingPast)}
                                className="text-[10px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-1 hover:text-brand-highlight transition-colors"
                            >
                                <PlusIcon className="w-3 h-3" /> {isAddingPast ? 'Cancelar' : 'Registrar Pasadas'}
                            </button>
                        </div>

                        {isAddingPast && (
                            <form onSubmit={handleAddPastVacation} className="bg-brand-secondary/50 p-6 rounded-2xl border-2 border-dashed border-brand-blue/30 mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-brand-light uppercase tracking-widest ml-1">Desde</label>
                                        <input
                                            type="date"
                                            value={pastStart}
                                            onChange={(e) => setPastStart(e.target.value)}
                                            required
                                            className="w-full bg-white border border-brand-accent rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-blue outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-brand-light uppercase tracking-widest ml-1">Hasta</label>
                                        <input
                                            type="date"
                                            value={pastEnd}
                                            onChange={(e) => setPastEnd(e.target.value)}
                                            required
                                            className="w-full bg-white border border-brand-accent rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-blue outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1 mb-4">
                                    <label className="text-[9px] font-black text-brand-light uppercase tracking-widest ml-1">Descripción</label>
                                    <input
                                        type="text"
                                        value={pastReason}
                                        onChange={(e) => setPastReason(e.target.value)}
                                        className="w-full bg-white border border-brand-accent rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-blue outline-none"
                                        placeholder="Ej: Vacaciones Invierno 2024"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-brand-blue text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-premium hover:brightness-110 active:scale-[0.98] transition-all">
                                    Confirmar Registro y Descontar Días
                                </button>
                            </form>
                        )}

                        <div className="space-y-2 opacity-70">
                            {pastRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between p-3 border-b border-brand-accent">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${req.status === 'APROBADA' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {req.status === 'APROBADA' ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-brand-highlight">
                                                {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                                            </p>
                                            <p className="text-[9px] text-brand-light font-bold uppercase tracking-wider">
                                                {req.days_count} {req.days_count === 1 ? 'Día' : 'Días'} • {req.reason}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteVacationRequest(req.id)}
                                        className="text-brand-light hover:text-red-500 p-1 transition-colors"
                                        title="Eliminar registro"
                                    >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

// Internal icons needed for the modal if they are not in the top-level Icons.tsx
const ClockIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default VacationApprovalModal;
