import React, { useState } from 'react';
import { Mission, MissionDifficulty, MissionStatus } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';

interface ApproveMissionModalProps {
    mission: Mission;
    onClose: () => void;
}

const ApproveMissionModal: React.FC<ApproveMissionModalProps> = ({ mission, onClose }) => {
    const { updateMission, showToast } = useAppContext();
    const [missionData, setMissionData] = useState<Mission>(mission);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateMission({
                ...missionData,
                status: MissionStatus.PENDING, // Approve by changing status
            });
            showToast('¡Misión aprobada y asignada!', 'success');
            onClose();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al aprobar la misión.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setMissionData(prev => ({ ...prev, [name]: name === 'xp' ? parseInt(value, 10) : value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-brand-secondary rounded-lg max-w-2xl w-full p-6 relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-6">Revisar y Aprobar Misión</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-light mb-1">Título</label>
                        <input type="text" name="title" value={missionData.title} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-light mb-1">Descripción</label>
                        <textarea name="description" value={missionData.description} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent h-24" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label className="block text-sm font-medium text-brand-light mb-1">Inicio</label><input type="date" name="startDate" value={missionData.startDate} onChange={handleChange} className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                        <div><label className="block text-sm font-medium text-brand-light mb-1">Límite</label><input type="date" name="deadline" value={missionData.deadline} onChange={handleChange} className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                        <div><label className="block text-sm font-medium text-brand-light mb-1">Dificultad</label><select name="difficulty" value={missionData.difficulty} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent"><option value={MissionDifficulty.LOW}>Bajo</option><option value={MissionDifficulty.MEDIUM}>Medio</option><option value={MissionDifficulty.HIGH}>Alto</option></select></div>
                        <div><label className="block text-sm font-medium text-brand-light mb-1">XP</label><input type="number" name="xp" value={missionData.xp} onChange={handleChange} min="0" className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full mt-6 bg-brand-green text-brand-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                    {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                    Aprobar Misión
                </button>
            </form>
        </div>
    );
};

export default ApproveMissionModal;
