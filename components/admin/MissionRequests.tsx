import React, { useMemo } from 'react';
import { Mission, MissionStatus } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';

interface MissionRequestsProps {
    onReview: (mission: Mission) => void;
}

const MissionRequests: React.FC<MissionRequestsProps> = ({ onReview }) => {
    const { missions, users, rejectMissionRequest, approveJoinRequest, rejectJoinRequest } = useData();
    const { showToast } = useToast();
    const requests = useMemo(() => missions.filter(m => m.status === MissionStatus.REQUESTED), [missions]);
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const handleReject = async (mission: Mission) => {
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

    const handleApprove = async (mission: Mission) => {
        if (mission.title.startsWith('[UNIRSE]')) {
            if (window.confirm(`¿Aprobar ingreso de técnico a la misión?`)) {
                await approveJoinRequest(mission);
            }
        } else {
            onReview(mission);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-brand-highlight tracking-tight">Centro de Notificaciones</h2>
                <p className="text-sm text-brand-light leading-none">Gestión de nuevas propuestas y refuerzos de personal.</p>
            </div>

            <div className="space-y-6">
                {requests.length === 0 ? (
                    <div className="border-4 border-dashed border-brand-accent/50 rounded-[40px] p-24 text-center bg-white/50">
                        <p className="text-[10px] font-black uppercase text-brand-light tracking-[0.3em] opacity-30">Bandeja de entrada vacía</p>
                    </div>
                ) : (
                    requests.map(mission => {
                        const user = usersMap.get(mission.assignedTo![0]);
                        const isJoinRequest = mission.title.startsWith('[UNIRSE]');
                        const originalTitle = isJoinRequest ? mission.title.replace('[UNIRSE] ', '') : mission.title;

                        return (
                            <div key={mission.id} className="bg-white rounded-[32px] shadow-soft hover:shadow-premium transition-all border border-brand-accent/50 p-6 flex flex-col md:flex-row md:items-center gap-6 group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-2 h-full ${isJoinRequest ? 'bg-brand-orange shadow-[2px_0_10px_rgba(242,143,39,0.3)]' : 'bg-brand-blue shadow-[2px_0_10px_rgba(30,136,229,0.3)]'}`}></div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isJoinRequest ? 'bg-brand-orange/10 text-brand-orange' : 'bg-brand-blue/10 text-brand-blue'}`}>
                                            {isJoinRequest ? 'Refuerzo' : 'Misión Nueva'}
                                        </span>
                                        <span className="text-[8px] font-bold text-brand-light/50">ID: {mission.id.slice(0, 8)}</span>
                                    </div>
                                    <h4 className="font-black text-xl text-brand-highlight leading-tight group-hover:text-brand-blue transition-colors">{originalTitle}</h4>
                                    <p className="text-xs text-brand-light mt-1.5 leading-relaxed italic opacity-80">
                                        {isJoinRequest ? 'El técnico solicita incorporarse al equipo de trabajo activo.' : mission.description}
                                    </p>

                                    {user && (
                                        <div className="flex items-center gap-3 mt-4 p-2 bg-brand-secondary/50 rounded-2xl w-fit pr-4 border border-brand-accent/30">
                                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-xl object-cover ring-2 ring-white shadow-sm" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-brand-light/60 uppercase tracking-tighter">Solicitado por</span>
                                                <span className="text-[10px] font-black text-brand-highlight">{user.name}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 shrink-0">
                                    <button
                                        onClick={() => handleApprove(mission)}
                                        className="flex-1 md:flex-none px-8 h-12 bg-brand-highlight text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue transition-all shadow-md active:scale-95"
                                    >
                                        {isJoinRequest ? 'Aprobar Unión' : 'Gestionar'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(mission)}
                                        className="h-12 px-6 bg-brand-red/10 text-brand-red rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all active:scale-95"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MissionRequests;