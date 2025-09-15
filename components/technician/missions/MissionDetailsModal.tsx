import React, { useState, useMemo, ChangeEvent } from 'react';
import { Mission, User, MissionStatus, MissionMilestone, MissionSupply, Role } from '../../../types';
import { LEVEL_THRESHOLDS, EARLY_COMPLETION_BONUS_XP } from '../../../config';
import { useAppContext } from '../../../contexts/AppContext';
import { hasSupplyAdminBadge } from '../../../utils/ranks';
import { CameraIcon, StarIcon } from '../../Icons';
import AssignSuppliesModal from '../../admin/missions/AssignSuppliesModal';

const MissionSuppliesPanel: React.FC<{ mission: Mission, canEdit: boolean }> = ({ mission, canEdit }) => {
    const { missionSupplies, updateMissionSupply, showToast } = useAppContext();
    const [updatingUsage, setUpdatingUsage] = useState<string | null>(null);

    const suppliesForMission = useMemo(() => {
        return missionSupplies.filter(ms => ms.mission_id === mission.id);
    }, [missionSupplies, mission.id]);

    const handleUsageChange = async (ms: MissionSupply, used: number) => {
        if (!canEdit) return;
        if (used < 0 || used > ms.quantity_assigned) {
            showToast("La cantidad usada no puede ser negativa o mayor a la asignada.", 'error');
            return;
        }
        setUpdatingUsage(ms.id);
        try {
            await updateMissionSupply(ms.id, { quantity_used: used });
            showToast('Uso de insumo actualizado.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al actualizar.", 'error');
        } finally {
            setUpdatingUsage(null);
        }
    }

    if (suppliesForMission.length === 0) {
        return <p className="text-brand-light italic text-center py-4">No hay insumos asignados a esta misión.</p>
    }
    
    return (
        <div className="space-y-3">
            {suppliesForMission.map(ms => (
                <div key={ms.id} className="bg-brand-primary p-3 rounded-lg flex items-center gap-4">
                    <img src={ms.supplies.photo_url || 'https://placehold.co/64x64/1b263b/e0e1dd?text=?'} alt={ms.supplies.model} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                    <div className="flex-grow">
                        <p className="font-bold">{ms.supplies.type} - {ms.supplies.model}</p>
                        <p className="text-xs text-brand-light">{ms.supplies.general_category} &gt; {ms.supplies.specific_category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Usados:</span>
                            <input
                                type="number"
                                defaultValue={ms.quantity_used}
                                min="0"
                                max={ms.quantity_assigned}
                                disabled={updatingUsage === ms.id || !canEdit}
                                onBlur={(e) => handleUsageChange(ms, parseInt(e.target.value, 10))}
                                className={`w-16 bg-brand-secondary p-1 rounded border border-brand-accent ${!canEdit ? 'cursor-not-allowed text-brand-light' : ''}`}
                            />
                            <span className="text-sm text-brand-light">/ {ms.quantity_assigned}</span>
                        </div>
                         {updatingUsage === ms.id && <div className="w-5 h-5 border-2 border-t-transparent border-brand-blue rounded-full animate-spin"></div>}
                    </div>
                </div>
            ))}
        </div>
    );
}


const MissionDetailsModal: React.FC<{
    mission: Mission;
    user: User;
    onClose: () => void;
    isAdminViewing?: boolean;
}> = ({ mission, user, onClose, isAdminViewing }) => {
    const { currentUser, updateUser, showToast, missionMilestones, users, addMissionMilestone, updateMission, toggleMilestoneSolution } = useAppContext();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isTogglingSolution, setIsTogglingSolution] = useState<string | null>(null);
    const [newMilestoneText, setNewMilestoneText] = useState('');
    const [newMilestoneImage, setNewMilestoneImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('milestones');
    const [isAssigningSupplies, setIsAssigningSupplies] = useState(false);

    const milestonesForMission = useMemo(() => 
        missionMilestones.filter(m => m.mission_id === mission.id),
    [missionMilestones, mission.id]);
    
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const assignedUsers = (mission.assignedTo || []).map(id => usersMap.get(id)).filter(Boolean) as User[];
    
    const isAdmin = currentUser?.role === Role.ADMIN;
    const canEditSupplies = !isAdminViewing && hasSupplyAdminBadge(user);

    const handleStatusChange = async (newStatus: MissionStatus) => {
        if (isAdminViewing) return;
        setIsUpdating(true);
        try {
            let updatedMissionData: Partial<Mission> = { id: mission.id, status: newStatus };
            if (newStatus === MissionStatus.COMPLETED) {
                const completionDate = new Date();
                const deadlineDate = new Date(mission.deadline);
                let bonusXp = 0;
                
                updatedMissionData.completedDate = completionDate.toISOString().split('T')[0];
                completionDate.setHours(0, 0, 0, 0);
                deadlineDate.setHours(23, 59, 59, 999);

                if (completionDate < deadlineDate) {
                    bonusXp = EARLY_COMPLETION_BONUS_XP;
                    updatedMissionData.bonusXp = bonusXp;
                }
                const totalXpGained = mission.xp + bonusXp;
                
                // Award XP to all assigned users
                for (const assignedUser of assignedUsers) {
                    const updatedUserData: Partial<User> = { id: assignedUser.id, xp: assignedUser.xp + totalXpGained };
                    const nextLevelXp = LEVEL_THRESHOLDS[assignedUser.level] || Infinity;
                    if((updatedUserData.xp || 0) >= nextLevelXp) updatedUserData.level = assignedUser.level + 1;
                    await updateUser(updatedUserData);
                }
            }
            await updateMission(updatedMissionData);
            showToast("Misión actualizada", 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al actualizar la misión", 'error');
        }
        setIsUpdating(false);
        onClose();
    };
    
    const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showToast('La imagen es muy grande. El límite es 5MB.', 'error');
                return;
            }
            setNewMilestoneImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMilestoneText.trim() || isUpdating) return;
        
        setIsUpdating(true);
        try {
            await addMissionMilestone(mission.id, newMilestoneText, newMilestoneImage);
            showToast("Hito añadido con éxito", 'success');
            setNewMilestoneText('');
            setNewMilestoneImage(null);
            setImagePreview(null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al añadir el hito", 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleToggleSolution = async (milestone: MissionMilestone) => {
        setIsTogglingSolution(milestone.id);
        try {
            await toggleMilestoneSolution(milestone.id, !milestone.is_solution);
        } catch (error) {
             showToast(error instanceof Error ? error.message : "Error al actualizar el hito", 'error');
        } finally {
            setIsTogglingSolution(null);
        }
    };
    
    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30 p-4">
            <div className="bg-brand-secondary rounded-lg max-w-2xl w-full p-6 relative max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl z-10">&times;</button>
                <div className="flex-shrink-0">
                    <h3 className="text-2xl font-bold mb-2">{mission.title}</h3>
                    <div className="flex items-center gap-2 mb-4">
                       <span className="text-sm font-semibold text-brand-light">Equipo:</span>
                       <div className="flex -space-x-2">
                           {assignedUsers.map(u => (
                               <img key={u.id} src={u.avatar} alt={u.name} title={u.name} className="w-8 h-8 rounded-full ring-2 ring-brand-secondary" />
                           ))}
                       </div>
                    </div>
                    <p className="text-brand-light mb-4">{mission.description}</p>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <p><strong>XP:</strong> <span className="text-brand-orange font-bold">{mission.xp} {mission.bonusXp ? `+ ${mission.bonusXp} (Bonus)` : ''}</span></p>
                        <p><strong>Dificultad:</strong> {mission.difficulty}</p>
                        <p><strong>Inicio:</strong> {new Date(mission.startDate + 'T00:00:00').toLocaleDateString()}</p>
                        <p><strong>Límite:</strong> {new Date(mission.deadline + 'T00:00:00').toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="border-t border-brand-accent my-2"></div>
                 {/* Tabs */}
                <div className="flex border-b border-brand-accent">
                    <button onClick={() => setActiveTab('milestones')} className={`flex-1 font-semibold py-2 transition-colors ${activeTab === 'milestones' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-brand-light hover:text-white'}`}>Hitos</button>
                    <button onClick={() => setActiveTab('supplies')} className={`flex-1 font-semibold py-2 transition-colors ${activeTab === 'supplies' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-brand-light hover:text-white'}`}>Insumos</button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 mt-4 space-y-4">
                    {activeTab === 'milestones' && (
                        <>
                            {milestonesForMission.length === 0 && <p className="text-brand-light italic text-center py-4">Aún no hay hitos para esta misión.</p>}
                            {milestonesForMission.map(milestone => {
                                const milestoneUser = usersMap.get(milestone.user_id);
                                return (
                                    <div key={milestone.id} className="flex gap-4">
                                        <img src={milestoneUser?.avatar} alt={milestoneUser?.name} className="w-10 h-10 rounded-full flex-shrink-0 mt-1" />
                                        <div className="flex-grow bg-brand-primary p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold">{milestoneUser?.name || 'Usuario desconocido'}</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xs text-brand-accent">{new Date(milestone.created_at).toLocaleString()}</p>
                                                    {isAdminViewing && (
                                                        <button
                                                            onClick={() => handleToggleSolution(milestone)}
                                                            disabled={isTogglingSolution === milestone.id}
                                                            className="p-1 rounded-full hover:bg-brand-accent/50 disabled:cursor-wait"
                                                            title={milestone.is_solution ? 'Quitar de Base de Conocimiento' : 'Añadir a Base de Conocimiento'}
                                                        >
                                                            {isTogglingSolution === milestone.id
                                                                ? <div className="w-5 h-5 border-2 border-t-transparent border-brand-blue rounded-full animate-spin"></div>
                                                                : <StarIcon className={`w-5 h-5 transition-colors ${milestone.is_solution ? 'text-yellow-400' : 'text-brand-light hover:text-white'}`} />
                                                            }
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-brand-light my-2">{milestone.description}</p>
                                            {milestone.image_url && <img src={milestone.image_url} alt="Hito de la misión" className="mt-2 rounded-lg max-h-64 w-full object-cover"/>}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                    {activeTab === 'supplies' && (
                        <div>
                             {isAdmin && <button onClick={() => setIsAssigningSupplies(true)} className="w-full bg-brand-blue text-white font-bold py-2 px-4 rounded-lg mb-4">Gestionar Insumos</button>}
                            <MissionSuppliesPanel mission={mission} canEdit={canEditSupplies} />
                        </div>
                    )}
                </div>

                <div className="border-t border-brand-accent my-4"></div>
                
                <div className="flex-shrink-0">
                    {!isAdminViewing && mission.status === MissionStatus.IN_PROGRESS && activeTab === 'milestones' && (
                        <form onSubmit={handleAddMilestone} className="bg-brand-primary p-4 rounded-lg">
                            <h4 className="font-bold mb-3">Añadir Nuevo Hito</h4>
                            <textarea
                                value={newMilestoneText}
                                onChange={e => setNewMilestoneText(e.target.value)}
                                placeholder="Describe el progreso o el problema encontrado..."
                                className="w-full bg-brand-secondary p-2 rounded border border-brand-accent"
                                rows={3}
                                required
                            />
                             <div className="flex items-center justify-between mt-2">
                                <label className="bg-brand-light text-brand-primary font-semibold py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-brand-highlight">
                                    <CameraIcon className="w-5 h-5" />
                                    <span>{newMilestoneImage ? "Cambiar foto" : "Adjuntar foto"}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange}/>
                                </label>
                                {imagePreview && (
                                    <div className="relative">
                                        <img src={imagePreview} alt="Vista previa" className="h-12 w-12 object-cover rounded-md" />
                                        <button type="button" onClick={() => { setNewMilestoneImage(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-brand-red text-white w-5 h-5 text-xs rounded-full flex items-center justify-center font-bold">&times;</button>
                                    </div>
                                )}
                                <button type="submit" disabled={isUpdating} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg disabled:bg-brand-accent flex items-center gap-2">
                                    {isUpdating && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                    Publicar Hito
                                </button>
                            </div>
                        </form>
                    )}

                    {!isAdminViewing && (
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {mission.status === MissionStatus.PENDING && <button onClick={() => handleStatusChange(MissionStatus.IN_PROGRESS)} disabled={isUpdating} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg disabled:bg-brand-accent">Iniciar Misión</button>}
                            {mission.status === MissionStatus.IN_PROGRESS && <button onClick={() => handleStatusChange(MissionStatus.COMPLETED)} disabled={isUpdating} className="bg-brand-green text-brand-primary font-bold py-2 px-4 rounded-lg disabled:bg-brand-accent">Finalizar Misión</button>}
                        </div>
                    )}
                </div>
            </div>
        </div>
        {isAssigningSupplies && <AssignSuppliesModal mission={mission} onClose={() => setIsAssigningSupplies(false)} />}
        </>
    );
};

export default MissionDetailsModal;