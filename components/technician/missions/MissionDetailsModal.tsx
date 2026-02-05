import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { Mission, User, MissionStatus, MissionMilestone, MissionSupply, Role } from '../../../types';
import { LEVEL_THRESHOLDS, EARLY_COMPLETION_BONUS_XP } from '../../../config';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { hasSupplyAdminBadge } from '../../../utils/ranks';
import { CameraIcon, StarIcon, BadgeIcon, CalendarIcon, FlagIcon, CurrencyDollarIcon } from '../../Icons';
import AssignSuppliesModal from '../../admin/missions/AssignSuppliesModal';

const SupplyUsageRow: React.FC<{ missionSupply: MissionSupply, canEdit: boolean }> = ({ missionSupply, canEdit }) => {
    const { updateMissionSupply } = useData();
    const { showToast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentUsed, setCurrentUsed] = useState(missionSupply.quantity_used);

    const handleUsageChange = async () => {
        if (!canEdit) return;
        if (currentUsed < 0 || currentUsed > missionSupply.quantity_assigned) {
            showToast("La cantidad usada no puede ser negativa o mayor a la asignada.", 'error');
            setCurrentUsed(missionSupply.quantity_used); // Reset
            return;
        }
        if (currentUsed === missionSupply.quantity_used) return; // No change

        setIsUpdating(true);
        try {
            await updateMissionSupply(missionSupply.id, { quantity_used: currentUsed });
            showToast('Uso de insumo actualizado.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al actualizar.", 'error');
            setCurrentUsed(missionSupply.quantity_used); // Revert on error
        } finally {
            setIsUpdating(false);
        }
    };

    // To handle external updates to missionSupply.quantity_used
    useEffect(() => {
        setCurrentUsed(missionSupply.quantity_used);
    }, [missionSupply.quantity_used]);

    return (
        <div className="bg-brand-primary p-3 rounded-lg flex items-center gap-4">
            <img src={missionSupply.supplies.photo_url || 'https://placehold.co/64x64/1b263b/e0e1dd?text=?'} alt={missionSupply.supplies.model} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
            <div className="flex-grow">
                <p className="font-bold">{missionSupply.supplies.type} - {missionSupply.supplies.model}</p>
                <p className="text-xs text-brand-light">{missionSupply.supplies.general_category} &gt; {missionSupply.supplies.specific_category}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm hidden sm:inline">Usados:</span>
                <input
                    type="number"
                    value={currentUsed}
                    onChange={(e) => setCurrentUsed(parseInt(e.target.value, 10) || 0)}
                    onBlur={handleUsageChange}
                    min="0"
                    max={missionSupply.quantity_assigned}
                    disabled={isUpdating || !canEdit}
                    className={`w-16 bg-brand-secondary p-1 rounded border border-brand-accent text-center ${!canEdit ? 'cursor-not-allowed text-brand-light' : ''}`}
                />
                <span className="text-sm text-brand-light">/ {missionSupply.quantity_assigned}</span>
                {isUpdating && <div className="w-5 h-5 border-2 border-t-transparent border-brand-blue rounded-full animate-spin"></div>}
            </div>
        </div>
    );
};


const MissionSuppliesPanel: React.FC<{ mission: Mission, canEdit: boolean }> = ({ mission, canEdit }) => {
    const { missionSupplies } = useData();

    const suppliesForMission = useMemo(() => {
        return missionSupplies.filter(ms => ms.mission_id === mission.id);
    }, [missionSupplies, mission.id]);

    if (suppliesForMission.length === 0) {
        return <p className="text-brand-light italic text-center py-4">No hay insumos asignados a esta misión.</p>
    }

    return (
        <div className="space-y-3">
            {suppliesForMission.map(ms => (
                <SupplyUsageRow key={ms.id} missionSupply={ms} canEdit={canEdit} />
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
    const { currentUser, updateUser, missionMilestones, users, addMissionMilestone, updateMission, toggleMilestoneSolution, createMissionBonusEvent } = useData();
    const { showToast } = useToast();
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

                // Award XP and monetary bonus to all assigned users
                for (const assignedUser of assignedUsers) {
                    // XP
                    const updatedUserData: Partial<User> = { id: assignedUser.id, xp: assignedUser.xp + totalXpGained };
                    const nextLevelXp = LEVEL_THRESHOLDS[assignedUser.level] || Infinity;
                    if ((updatedUserData.xp || 0) >= nextLevelXp) updatedUserData.level = assignedUser.level + 1;
                    await updateUser(updatedUserData);
                    // Monetary Bonus
                    if (mission.bonusMonetario && mission.bonusMonetario > 0) {
                        await createMissionBonusEvent(assignedUser.id, mission);
                    }
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
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-3xl font-extrabold text-white tracking-tight">{mission.title}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${mission.difficulty === 'Bajo' ? 'bg-green-500/20 text-green-400' :
                                            mission.difficulty === 'Medio' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>
                                        {mission.difficulty}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-brand-light">
                                        <BadgeIcon className="w-3 h-3 text-brand-blue" />
                                        <span>{mission.xp} XP</span>
                                        {mission.bonusXp ? <span className="text-brand-orange">+{mission.bonusXp}</span> : ''}
                                    </div>
                                    {mission.bonusMonetario && mission.bonusMonetario > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-brand-green font-bold">
                                            <CurrencyDollarIcon className="w-3 h-3" />
                                            <span>${mission.bonusMonetario.toLocaleString('es-AR')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex -space-x-2">
                                {assignedUsers.map(u => (
                                    <img key={u.id} src={u.avatar} alt={u.name} title={u.name} className="w-10 h-10 rounded-full border-2 border-brand-secondary shadow-lg hover:z-10 transition-transform hover:scale-110" />
                                ))}
                            </div>
                        </div>

                        <p className="text-brand-light mb-6 text-sm leading-relaxed">{mission.description}</p>

                        <div className="flex items-center gap-6 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-brand-primary/50 text-brand-blue">
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-brand-light uppercase font-bold">Inicio</p>
                                    <p className="text-xs font-bold">{new Date(mission.startDate + 'T00:00:00').toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-brand-primary/50 text-brand-red">
                                    <FlagIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-brand-light uppercase font-bold">Límite</p>
                                    <p className="text-xs font-bold">{new Date(mission.deadline + 'T00:00:00').toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-brand-accent my-2"></div>
                    {/* Tabs */}
                    <div className="flex border-b border-brand-accent">
                        <button onClick={() => setActiveTab('milestones')} className={`flex-1 font-semibold py-2 transition-colors ${activeTab === 'milestones' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-brand-light hover:text-white'}`}>Hitos</button>
                        <button onClick={() => setActiveTab('supplies')} className={`flex-1 font-semibold py-2 transition-colors ${activeTab === 'supplies' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-brand-light hover:text-white'}`}>Insumos</button>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 mt-4 relative">
                        {activeTab === 'milestones' && (
                            <div className="relative">
                                {/* Vertical Line for Thread */}
                                {milestonesForMission.length > 1 && (
                                    <div className="absolute left-[1.25rem] top-4 bottom-4 w-[2px] bg-brand-accent/30 z-0"></div>
                                )}

                                <div className="space-y-6">
                                    {milestonesForMission.length === 0 && <p className="text-brand-light italic text-center py-4">Aún no hay hitos para esta misión.</p>}
                                    {milestonesForMission.map(milestone => {
                                        const milestoneUser = usersMap.get(milestone.user_id);
                                        return (
                                            <div key={milestone.id} className="relative flex gap-4 z-10">
                                                <div className="flex-shrink-0 relative">
                                                    <img src={milestoneUser?.avatar} alt={milestoneUser?.name} className="w-10 h-10 rounded-full ring-4 ring-brand-secondary bg-brand-secondary z-10" />
                                                </div>
                                                <div className="flex-grow bg-brand-primary p-4 rounded-xl shadow-sm border border-brand-accent/20">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div>
                                                            <span className="font-bold text-white mr-2">{milestoneUser?.name || 'Usuario desconocido'}</span>
                                                            <span className="text-xs text-brand-light">{new Date(milestone.created_at).toLocaleDateString()} · {new Date(milestone.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        {isAdminViewing && (
                                                            <button
                                                                onClick={() => handleToggleSolution(milestone)}
                                                                disabled={isTogglingSolution === milestone.id}
                                                                className="p-1.5 rounded-full hover:bg-brand-accent/30 transition-colors disabled:cursor-wait"
                                                                title={milestone.is_solution ? 'Quitar de Base de Conocimiento' : 'Añadir a Base de Conocimiento'}
                                                            >
                                                                {isTogglingSolution === milestone.id
                                                                    ? <div className="w-4 h-4 border-2 border-t-transparent border-brand-blue rounded-full animate-spin"></div>
                                                                    : <StarIcon className={`w-5 h-5 transition-colors ${milestone.is_solution ? 'text-yellow-400' : 'text-brand-light hover:text-white'}`} />
                                                                }
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-brand-light text-sm leading-relaxed whitespace-pre-wrap">{milestone.description}</p>
                                                    {milestone.image_url && (
                                                        <div className="mt-3 rounded-lg overflow-hidden border border-brand-accent/30 shadow-inner">
                                                            <img src={milestone.image_url} alt="Imagen del hito" className="max-h-80 w-full object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in" onClick={() => window.open(milestone.image_url!, '_blank')} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {activeTab === 'supplies' && (
                            <div className="space-y-4">
                                {isAdmin && <button onClick={() => setIsAssigningSupplies(true)} className="w-full bg-brand-blue text-white font-bold py-2 px-4 rounded-lg mb-4 hover:bg-blue-600 transition-colors shadow-lg">Gestionar Insumos</button>}
                                <MissionSuppliesPanel mission={mission} canEdit={canEditSupplies} />
                            </div>
                        )}
                    </div>

                    <div className="border-t border-brand-accent my-4"></div>

                    <div className="flex-shrink-0">
                        {!isAdminViewing && mission.status === MissionStatus.IN_PROGRESS && activeTab === 'milestones' && (
                            <form onSubmit={handleAddMilestone} className="bg-brand-primary p-4 rounded-xl border border-brand-accent/20 shadow-lg">
                                <div className="flex gap-3">
                                    <img src={currentUser?.avatar} alt={currentUser?.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                                    <div className="flex-grow">
                                        <textarea
                                            value={newMilestoneText}
                                            onChange={e => setNewMilestoneText(e.target.value)}
                                            placeholder="¿Qué novedades hay en el proyecto?"
                                            className="w-full bg-transparent p-2 text-white placeholder-brand-light focus:outline-none resize-none text-lg"
                                            rows={2}
                                            required
                                        />

                                        {imagePreview && (
                                            <div className="relative mt-2 inline-block">
                                                <img src={imagePreview} alt="Vista previa" className="max-h-32 rounded-lg border border-brand-accent/30" />
                                                <button type="button" onClick={() => { setNewMilestoneImage(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-brand-red text-white w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg">&times;</button>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-accent/20">
                                            <label className="text-brand-blue hover:bg-brand-blue/10 p-2 rounded-full transition-colors cursor-pointer" title="Adjuntar foto">
                                                <CameraIcon className="w-6 h-6" />
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
                                            </label>

                                            <button
                                                type="submit"
                                                disabled={isUpdating || !newMilestoneText.trim()}
                                                className="bg-brand-blue border-none text-white font-bold py-2 px-6 rounded-full disabled:opacity-50 disabled:bg-brand-accent hover:bg-blue-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                            >
                                                {isUpdating && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                                Publicar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}

                        {!isAdminViewing && (
                            <div className="flex flex-wrap gap-3 justify-center mt-6">
                                {mission.status === MissionStatus.PENDING && (
                                    <button onClick={() => handleStatusChange(MissionStatus.IN_PROGRESS)} disabled={isUpdating} className="bg-brand-blue text-white font-bold py-3 px-8 rounded-full hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                        Iniciar Misión
                                    </button>
                                )}
                                {mission.status === MissionStatus.IN_PROGRESS && (
                                    <button onClick={() => handleStatusChange(MissionStatus.COMPLETED)} disabled={isUpdating} className="bg-brand-green text-brand-primary font-bold py-3 px-8 rounded-full hover:bg-green-500 transition-all shadow-lg active:scale-95 disabled:opacity-50 border-none">
                                        Finalizar Misión
                                    </button>
                                )}
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