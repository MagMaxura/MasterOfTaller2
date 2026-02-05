import React, { useState } from 'react';
import { Mission, MissionDifficulty, MissionStatus, Role, User } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';

interface ApproveMissionModalProps {
    mission: Mission;
    onClose: () => void;
}

const ApproveMissionModal: React.FC<ApproveMissionModalProps> = ({ mission, onClose }) => {
    const { users, updateMission } = useData();
    const { showToast } = useToast();
    const [missionData, setMissionData] = useState<Mission>({ ...mission, bonusMonetario: mission.bonusMonetario || 0 });
    const [isLoading, setIsLoading] = useState(false);

    const technicians = users.filter(u => u.role === Role.TECHNICIAN);
    const isApprovalMode = mission.status === MissionStatus.REQUESTED;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isApprovalMode && (missionData.xp || 0) <= 0) {
            showToast('Debes asignar un valor de XP mayor a 0 para aprobar la misión.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const finalStatus = isApprovalMode ? MissionStatus.PENDING : missionData.status;
            await updateMission({
                ...missionData,
                status: finalStatus,
            });
            showToast(isApprovalMode ? '¡Misión aprobada y asignada!' : 'Misión actualizada con éxito.', 'success');
            onClose();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al guardar los cambios.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['xp', 'bonusMonetario'].includes(name);
        setMissionData(prev => ({ ...prev, [name]: isNumeric ? parseInt(value, 10) || 0 : value }));
    };

    const handleVisibilityChange = (technicianId: string) => {
        setMissionData(prev => {
            const currentVisibleTo = prev.visibleTo || [];
            const newVisibleTo = currentVisibleTo.includes(technicianId)
                ? currentVisibleTo.filter(id => id !== technicianId)
                : [...currentVisibleTo, technicianId];
            return { ...prev, visibleTo: newVisibleTo };
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-brand-secondary rounded-lg max-w-2xl w-full p-6 relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-6">{isApprovalMode ? 'Revisar y Aprobar Misión' : 'Editar Misión'}</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-light mb-1">Título</label>
                        <input type="text" name="title" value={missionData.title} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-light mb-1">Descripción</label>
                        <textarea name="description" value={missionData.description} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent h-24" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        <div><label className="block text-sm font-medium text-brand-light mb-1">Inicio</label><input type="date" name="startDate" value={missionData.startDate} onChange={handleChange} className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                        <div><label className="block text-sm font-medium text-brand-light mb-1">Límite</label><input type="date" name="deadline" value={missionData.deadline} onChange={handleChange} className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                        <div><label className="block text-sm font-medium text-brand-light mb-1">Dificultad</label><select name="difficulty" value={missionData.difficulty} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent"><option value={MissionDifficulty.LOW}>Bajo</option><option value={MissionDifficulty.MEDIUM}>Medio</option><option value={MissionDifficulty.HIGH}>Alto</option></select></div>
                        <div><label className="block text-sm font-medium text-brand-light mb-1">XP</label><input type="number" name="xp" value={missionData.xp} onChange={handleChange} min="0" className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                        <div><label className="block text-sm font-medium text-brand-light mb-1">Bono ($)</label><input type="number" name="bonusMonetario" value={missionData.bonusMonetario || 0} onChange={handleChange} min="0" className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-light mb-1">Estado</label>
                        <select name="status" value={missionData.status} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent">
                            {Object.values(MissionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-brand-light mb-1">Asignada a</label>
                        <div className="bg-brand-primary p-3 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto mb-4">
                            {technicians.map(tech => (
                                <div key={tech.id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={`modal-assign-${tech.id}`}
                                        checked={missionData.assignedTo?.includes(tech.id) ?? false}
                                        onChange={() => setMissionData(prev => {
                                            const current = prev.assignedTo || [];
                                            const newAssigned = current.includes(tech.id)
                                                ? current.filter(id => id !== tech.id)
                                                : [...current, tech.id];
                                            return { ...prev, assignedTo: newAssigned };
                                        })}
                                        className="h-5 w-5 rounded bg-brand-secondary border-brand-accent text-brand-orange focus:ring-brand-orange"
                                    />
                                    <label htmlFor={`modal-assign-${tech.id}`} className="flex items-center gap-2 text-brand-light select-none cursor-pointer">
                                        <img src={tech.avatar} alt={tech.name} className="w-6 h-6 rounded-full" />
                                        <span>{tech.name}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-brand-light mb-1">Visible para</label>
                        <div className="bg-brand-primary p-3 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                            {technicians.map(tech => (
                                <div key={tech.id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={`modal-vis-${tech.id}`}
                                        checked={missionData.visibleTo?.includes(tech.id) ?? false}
                                        onChange={() => handleVisibilityChange(tech.id)}
                                        className="h-5 w-5 rounded bg-brand-secondary border-brand-accent text-brand-blue focus:ring-brand-blue"
                                    />
                                    <label htmlFor={`modal-vis-${tech.id}`} className="flex items-center gap-2 text-brand-light select-none cursor-pointer">
                                        <img src={tech.avatar} alt={tech.name} className="w-6 h-6 rounded-full" />
                                        <span>{tech.name}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full mt-6 bg-brand-green text-brand-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                    {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                    {isApprovalMode ? 'Aprobar Misión' : 'Guardar Cambios'}
                </button>
            </form>
        </div>
    );
};

export default ApproveMissionModal;