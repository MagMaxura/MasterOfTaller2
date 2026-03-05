import React, { useMemo } from 'react';
import { Mission, MissionStatus, VacationRequest } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { CalendarIcon, ClockIcon, CheckIcon, XIcon } from '../Icons';

interface MissionRequestsProps {
    onReview: (mission: Mission) => void;
}

const MissionRequests: React.FC<MissionRequestsProps> = ({ onReview }) => {
    const { missions, users, vacationRequests, rejectMissionRequest, approveJoinRequest, rejectJoinRequest, updateVacationStatus } = useData();
    const { showToast } = useToast();

    const missionRequests = useMemo(() => missions.filter(m => m.status === MissionStatus.REQUESTED), [missions]);
    const pendingVacations = useMemo(() => vacationRequests.filter(r => r.status === 'PENDIENTE'), [vacationRequests]);
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const handleRejectMission = async (mission: Mission) => {
        const user = usersMap.get(mission.assignedTo![0]);
        const msg = mission.title.startsWith('[UNIRSE]')
            ? `¿Rechazar solicitud de ${user?.name}?`
            : `¿Rechazar misión "${mission.title}"?`;

        if (window.confirm(msg)) {
            try {
                if (mission.title.startsWith('[UNIRSE]')) {
                    await rejectJoinRequest(mission.id);
                } else {
                    await rejectMissionRequest(mission.id);
                }
                showToast('Solicitud rechazada.', 'success');
            } catch (error) {
                showToast(error instanceof Error ? error.message : 'Error al rechazar.', 'error');
            }
        }
    };

    const handleApproveMission = async (mission: Mission) => {
        if (mission.title.startsWith('[UNIRSE]')) {
            if (window.confirm(`¿Aprobar ingreso de técnico a la misión?`)) {
                await approveJoinRequest(mission);
            }
        } else {
            onReview(mission);
        }
    };

    const handleApproveVacation = async (request: VacationRequest) => {
        if (window.confirm(`¿Aprobar vacaciones para ${usersMap.get(request.user_id)?.name}?`)) {
            try {
                await updateVacationStatus(request.id, 'APROBADA');
                showToast('Vacaciones aprobadas.', 'success');
            } catch (error) {
                showToast('Error al aprobar vacaciones.', 'error');
            }
        }
    };

    const handleRejectVacation = async (request: VacationRequest) => {
        if (window.confirm(`¿Rechazar vacaciones para ${usersMap.get(request.user_id)?.name}?`)) {
            try {
                await updateVacationStatus(request.id, 'RECHAZADA');
                showToast('Vacaciones rechazadas.', 'info');
            } catch (error) {
                showToast('Error al rechazar vacaciones.', 'error');
            }
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-brand-highlight tracking-tight">Centro de Solicitudes</h2>
                <p className="text-sm text-brand-light leading-none">Gestiona propuestas de misiones y solicitudes de descanso.</p>
            </div>

            {/* SECCIÓN MISIONES */}
            <section className="space-y-6">
                <h3 className="text-[11px] font-black text-brand-light uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                    <ClockIcon className="w-4 h-4" /> Misiones y Refuerzos
                </h3>
                {missionRequests.length === 0 ? (
                    <div className="border-4 border-dashed border-brand-accent/50 rounded-[40px] p-12 text-center bg-white/30">
                        <p className="text-[10px] font-black uppercase text-brand-light tracking-[0.3em] opacity-30">Sin solicitudes de misiones</p>
                    </div>
                ) : (
                    missionRequests.map(mission => {
                        const user = usersMap.get(mission.assignedTo![0]);
                        const isJoinRequest = mission.title.startsWith('[UNIRSE]');
                        const originalTitle = isJoinRequest ? mission.title.replace('[UNIRSE] ', '') : mission.title;

                        return (
                            <RequestCard
                                key={mission.id}
                                id={mission.id}
                                title={originalTitle}
                                description={isJoinRequest ? 'El técnico solicita incorporarse al equipo de trabajo activo.' : mission.description}
                                type={isJoinRequest ? 'REFUERZO' : 'MISION'}
                                user={user}
                                onApprove={() => handleApproveMission(mission)}
                                onReject={() => handleRejectMission(mission)}
                                approveLabel={isJoinRequest ? 'Aprobar Unión' : 'Gestionar'}
                            />
                        );
                    })
                )}
            </section>

            {/* SECCIÓN VACACIONES */}
            <section className="space-y-6">
                <h3 className="text-[11px] font-black text-brand-light uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                    <CalendarIcon className="w-4 h-4" /> Solicitudes de Vacaciones
                </h3>
                {pendingVacations.length === 0 ? (
                    <div className="border-4 border-dashed border-brand-accent/50 rounded-[40px] p-12 text-center bg-white/30">
                        <p className="text-[10px] font-black uppercase text-brand-light tracking-[0.3em] opacity-30">Sin solicitudes de descanso</p>
                    </div>
                ) : (
                    pendingVacations.map(request => {
                        const user = usersMap.get(request.user_id);
                        return (
                            <RequestCard
                                key={request.id}
                                id={request.id}
                                title={`Vacaciones: ${request.days_count} días`}
                                description={`Desde el ${new Date(request.start_date).toLocaleDateString()} hasta el ${new Date(request.end_date).toLocaleDateString()}. ${request.reason || ''}`}
                                type="VACACIONES"
                                user={user}
                                onApprove={() => handleApproveVacation(request)}
                                onReject={() => handleRejectVacation(request)}
                                approveLabel="Aprobar"
                            />
                        );
                    })
                )}
            </section>
        </div>
    );
};

const RequestCard: React.FC<{
    id: string;
    title: string;
    description: string;
    type: 'MISION' | 'REFUERZO' | 'VACACIONES';
    user?: any;
    onApprove: () => void;
    onReject: () => void;
    approveLabel: string;
}> = ({ id, title, description, type, user, onApprove, onReject, approveLabel }) => {
    const typeStyles = {
        MISION: 'bg-brand-blue/10 text-brand-blue border-brand-blue shadow-[2px_0_10px_rgba(30,136,229,0.3)]',
        REFUERZO: 'bg-brand-orange/10 text-brand-orange border-brand-orange shadow-[2px_0_10px_rgba(242,143,39,0.3)]',
        VACACIONES: 'bg-brand-green/10 text-brand-green border-brand-green shadow-[2px_0_10px_rgba(76,175,80,0.3)]'
    };

    const barColor = type === 'MISION' ? 'bg-brand-blue' : type === 'REFUERZO' ? 'bg-brand-orange' : 'bg-brand-green';

    return (
        <div className="bg-white rounded-[32px] shadow-soft hover:shadow-premium transition-all border border-brand-accent/50 p-6 flex flex-col md:flex-row md:items-center gap-6 group relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-full ${barColor} opacity-80 shadow-md`}></div>

            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${typeStyles[type].split(' ').slice(0, 2).join(' ')}`}>
                        {type}
                    </span>
                    <span className="text-[8px] font-bold text-brand-light/50 uppercase tracking-tighter">ID: {id.slice(0, 8)}</span>
                </div>
                <h4 className="font-black text-xl text-brand-highlight leading-tight group-hover:text-brand-blue transition-colors">{title}</h4>
                <p className="text-xs text-brand-light mt-1.5 leading-relaxed italic opacity-80">{description}</p>

                {user && (
                    <div className="flex items-center gap-3 mt-4 p-2 bg-brand-secondary/50 rounded-2xl w-fit pr-4 border border-brand-accent/30">
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-xl object-cover ring-2 ring-white shadow-sm" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-brand-light/60 uppercase tracking-tighter leading-none">Solicitado por</span>
                            <span className="text-[10px] font-black text-brand-highlight">{user.name}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3 shrink-0">
                <button
                    onClick={onApprove}
                    className="flex-1 md:flex-none px-8 h-12 bg-brand-highlight text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                    <CheckIcon className="w-4 h-4" />
                    {approveLabel}
                </button>
                <button
                    onClick={onReject}
                    className="h-12 px-6 bg-brand-red/10 text-brand-red rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <XIcon className="w-4 h-4" />
                    Rechazar
                </button>
            </div>
        </div>
    );
};

export default MissionRequests;
