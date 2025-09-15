import React, { useMemo } from 'react';
import { Mission, MissionStatus } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface MissionRequestsProps {
    onApprove: (mission: Mission) => void;
}

const MissionRequests: React.FC<MissionRequestsProps> = ({ onApprove }) => {
    const { missions, users, rejectMissionRequest, approveJoinRequest, rejectJoinRequest, showToast } = useAppContext();
    const requests = useMemo(() => missions.filter(m => m.status === MissionStatus.REQUESTED), [missions]);
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const handleReject = async (mission: Mission) => {
        if (mission.title.startsWith('[UNIRSE]')) {
            if (window.confirm(`¿Rechazar la solicitud de ${usersMap.get(mission.assignedTo![0])?.name} para unirse a la misión?`)) {
                await rejectJoinRequest(mission.id);
            }
        } else {
            if (window.confirm(`¿Rechazar la solicitud para la misión "${mission.title}"? La misión volverá a estar disponible.`)) {
                try {
                    await rejectMissionRequest(mission.id);
                    showToast('Solicitud rechazada.', 'success');
                } catch (error) {
                    showToast(error instanceof Error ? error.message : 'Error al rechazar.', 'error');
                }
            }
        }
    };
    
    const handleApprove = async (mission: Mission) => {
        if (mission.title.startsWith('[UNIRSE]')) {
             if (window.confirm(`¿Aprobar la solicitud de ${usersMap.get(mission.assignedTo![0])?.name} para unirse a la misión?`)) {
                await approveJoinRequest(mission);
            }
        } else {
            onApprove(mission);
        }
    }

    return (
        <div className="bg-brand-secondary p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Solicitudes de Misión Pendientes</h3>
            <div className="space-y-4">
                {requests.length === 0 && <p className="text-brand-light italic text-center p-8">No hay nuevas solicitudes de misión.</p>}
                {requests.map(mission => {
                    const user = usersMap.get(mission.assignedTo![0]);
                    const isJoinRequest = mission.title.startsWith('[UNIRSE]');
                    const originalTitle = isJoinRequest ? mission.title.replace('[UNIRSE] ', '') : mission.title;

                    return (
                        <div key={mission.id} className={`bg-brand-primary rounded-lg shadow-lg p-4 flex flex-col md:flex-row md:items-center gap-4 border-l-4 ${isJoinRequest ? 'border-brand-orange' : 'border-brand-blue'}`}>
                            <div className="flex-grow">
                                <h4 className="font-bold text-lg">{originalTitle}</h4>
                                <p className="text-sm text-brand-light mt-1">{isJoinRequest ? `El técnico solicita unirse a esta misión.` : mission.description}</p>
                                {user && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-brand-accent">
                                        <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                                        <span>Solicitado por: {user.name}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-shrink-0 flex gap-2">
                                <button onClick={() => handleApprove(mission)} className="bg-brand-green text-brand-primary font-semibold py-2 px-3 rounded hover:bg-green-300">
                                    {isJoinRequest ? 'Aprobar Unión' : 'Revisar y Aprobar'}
                                </button>
                                <button onClick={() => handleReject(mission)} className="bg-brand-red text-white font-semibold py-2 px-3 rounded hover:bg-red-700">
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MissionRequests;