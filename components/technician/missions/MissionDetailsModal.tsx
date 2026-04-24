import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { Mission, User, MissionStatus, MissionMilestone, MissionSupply, Role, MissionMilestoneType } from '../../../types';
import { LEVEL_THRESHOLDS, EARLY_COMPLETION_BONUS_XP } from '../../../config';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { hasSupplyAdminBadge } from '../../../utils/ranks';
import { api } from '../../../services/api';
import { CameraIcon, StarIcon, BadgeIcon, CalendarIcon, FlagIcon, CurrencyDollarIcon, BookOpenIcon } from '../../Icons';
import AssignSuppliesModal from '../../admin/missions/AssignSuppliesModal';

const EVIDENCE_MAX_GAP_MS = 2 * 60 * 60 * 1000;
const EVIDENCE_GRACE_MS = 10 * 60 * 1000;

const MILESTONE_TYPE_LABELS: Record<MissionMilestoneType, string> = {
  [MissionMilestoneType.BEFORE]: 'Antes',
  [MissionMilestoneType.CHECKPOINT_2H]: 'Control 2h',
  [MissionMilestoneType.AFTER]: 'Despues',
  [MissionMilestoneType.NOTE]: 'Nota'
};

const MILESTONE_TYPE_COLORS: Record<MissionMilestoneType, string> = {
  [MissionMilestoneType.BEFORE]: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  [MissionMilestoneType.CHECKPOINT_2H]: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  [MissionMilestoneType.AFTER]: 'bg-green-500/20 text-green-300 border-green-400/30',
  [MissionMilestoneType.NOTE]: 'bg-slate-500/20 text-slate-300 border-slate-400/30'
};

const isEvidenceType = (type: MissionMilestoneType) =>
  type === MissionMilestoneType.BEFORE || type === MissionMilestoneType.CHECKPOINT_2H || type === MissionMilestoneType.AFTER;

const SupplyUsageRow: React.FC<{ missionSupply: MissionSupply; canEdit: boolean }> = ({ missionSupply, canEdit }) => {
  const { updateMissionSupply } = useData();
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUsed, setCurrentUsed] = useState(missionSupply.quantity_used);

  const handleUsageChange = async () => {
    if (!canEdit) return;
    if (currentUsed < 0 || currentUsed > missionSupply.quantity_assigned) {
      showToast('La cantidad usada no puede ser negativa o mayor a la asignada.', 'error');
      setCurrentUsed(missionSupply.quantity_used);
      return;
    }
    if (currentUsed === missionSupply.quantity_used) return;

    setIsUpdating(true);
    try {
      await updateMissionSupply(missionSupply.id, { quantity_used: currentUsed });
      showToast('Uso de insumo actualizado.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al actualizar.', 'error');
      setCurrentUsed(missionSupply.quantity_used);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    setCurrentUsed(missionSupply.quantity_used);
  }, [missionSupply.quantity_used]);

  return (
    <div className="bg-slate-800/50 p-3 rounded-lg flex items-center gap-4 border border-white/5">
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
          onChange={e => setCurrentUsed(parseInt(e.target.value, 10) || 0)}
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

const MissionSuppliesPanel: React.FC<{ mission: Mission; canEdit: boolean }> = ({ mission, canEdit }) => {
  const { missionSupplies } = useData();
  const suppliesForMission = useMemo(() => missionSupplies.filter(ms => ms.mission_id === mission.id), [missionSupplies, mission.id]);

  if (suppliesForMission.length === 0) {
    return <p className="text-brand-light italic text-center py-4">No hay insumos asignados a esta mision.</p>;
  }

  return (
    <div className="space-y-3">
      {suppliesForMission.map(ms => (
        <SupplyUsageRow key={ms.id} missionSupply={ms} canEdit={canEdit} />
      ))}
    </div>
  );
};

const RequirementsPanel: React.FC<{ mission: Mission }> = ({ mission }) => {
  const { missionRequirements, addMissionRequirement, deleteMissionRequirement, updateMissionRequirement } = useData();
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const items = useMemo(() => missionRequirements.filter(r => r.mission_id === mission.id), [missionRequirements, mission.id]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setIsAdding(true);
    try {
      await addMissionRequirement(mission.id, newItem, 1);
      setNewItem('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Ej: Rodamiento NTN 42..."
          className="flex-grow bg-slate-800 p-2 rounded-lg border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue/50"
        />
        <button type="submit" disabled={isAdding || !newItem.trim()} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50">
          Anadir
        </button>
      </form>

      <div className="space-y-2">
        {items.length === 0 && <p className="text-brand-light italic text-center py-4">No hay solicitudes pendientes.</p>}
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-white/5 group hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.is_purchased}
                onChange={() => updateMissionRequirement(item.id, { is_purchased: !item.is_purchased })}
                className="w-5 h-5 rounded border-brand-accent bg-brand-secondary text-brand-blue focus:ring-brand-blue"
              />
              <span className={`text-white ${item.is_purchased ? 'line-through text-brand-light' : ''}`}>{item.description}</span>
            </div>
            <button onClick={() => deleteMissionRequirement(item.id)} className="text-brand-red p-1 hover:bg-brand-red/10 rounded">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [newMilestoneType, setNewMilestoneType] = useState<MissionMilestoneType>(
    mission.status === MissionStatus.PENDING ? MissionMilestoneType.BEFORE : MissionMilestoneType.CHECKPOINT_2H
  );
  const [activeTab, setActiveTab] = useState<'info' | 'milestones' | 'requirements' | 'supplies'>('info');
  const [isAssigningSupplies, setIsAssigningSupplies] = useState(false);

  const milestonesForMission = useMemo(
    () =>
      missionMilestones
        .filter(m => m.mission_id === mission.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [missionMilestones, mission.id]
  );

  const evidenceMilestones = useMemo(
    () => milestonesForMission.filter(m => isEvidenceType(m.milestone_type) && !!m.image_url),
    [milestonesForMission]
  );

  const beforeMilestone = useMemo(
    () => evidenceMilestones.find(m => m.milestone_type === MissionMilestoneType.BEFORE),
    [evidenceMilestones]
  );
  const afterMilestone = useMemo(
    () => evidenceMilestones.filter(m => m.milestone_type === MissionMilestoneType.AFTER).at(-1),
    [evidenceMilestones]
  );
  const lastEvidenceMilestone = useMemo(() => evidenceMilestones.at(-1), [evidenceMilestones]);

  const nextEvidenceDue = useMemo(() => {
    if (mission.status !== MissionStatus.IN_PROGRESS || !lastEvidenceMilestone) return null;
    return new Date(new Date(lastEvidenceMilestone.created_at).getTime() + EVIDENCE_MAX_GAP_MS);
  }, [lastEvidenceMilestone, mission.status]);

  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const assignedUsers = (mission.assignedTo || []).map(id => usersMap.get(id)).filter(Boolean) as User[];

  const isAdmin = currentUser?.role === Role.ADMIN;
  const canEditSupplies = !isAdminViewing && hasSupplyAdminBadge(user);
  const canSubmitMilestone = !isAdminViewing && (mission.status === MissionStatus.PENDING || mission.status === MissionStatus.IN_PROGRESS);

  const validateCadenceInClient = (endDate: Date) => {
    if (!beforeMilestone) return 'Debes registrar evidencia de ANTES con foto.';
    const from = new Date(beforeMilestone.created_at).getTime();
    const to = endDate.getTime();
    const points = evidenceMilestones
      .filter(m => {
        const t = new Date(m.created_at).getTime();
        return t >= from && t <= to;
      })
      .map(m => new Date(m.created_at).getTime())
      .sort((a, b) => a - b);

    if (points.length === 0) return 'No hay evidencias de avance para validar.';
    let prev = points[0];
    for (let i = 1; i < points.length; i++) {
      if (points[i] - prev > EVIDENCE_MAX_GAP_MS + EVIDENCE_GRACE_MS) {
        return 'Hay un salto mayor a 2 horas entre evidencias.';
      }
      prev = points[i];
    }
    if (to - prev > EVIDENCE_MAX_GAP_MS + EVIDENCE_GRACE_MS) {
      return 'Falta una foto de control en las ultimas 2 horas.';
    }
    return null;
  };

  const handleStatusChange = async (newStatus: MissionStatus) => {
    if (isAdminViewing) return;

    if (newStatus === MissionStatus.IN_PROGRESS && !beforeMilestone) {
      showToast('Antes de iniciar debes registrar evidencia de ANTES con foto.', 'error');
      setActiveTab('milestones');
      return;
    }

    if (newStatus === MissionStatus.COMPLETED) {
      if (!beforeMilestone) {
        showToast('No puedes completar sin evidencia de ANTES.', 'error');
        setActiveTab('milestones');
        return;
      }
      if (!afterMilestone) {
        showToast('No puedes completar sin evidencia de DESPUES con foto.', 'error');
        setActiveTab('milestones');
        return;
      }

      const localCadenceError = validateCadenceInClient(new Date(afterMilestone.created_at));
      if (localCadenceError) {
        showToast(localCadenceError, 'error');
        setActiveTab('milestones');
        return;
      }

      try {
        const evidenceCheck = await api.validateMissionEvidence(mission.id, afterMilestone.created_at);
        if (!evidenceCheck.is_valid) {
          showToast(evidenceCheck.message, 'error');
          setActiveTab('milestones');
          return;
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'No se pudo validar evidencia en servidor.', 'error');
        return;
      }
    }

    setIsUpdating(true);
    try {
      const updatedMissionData: Partial<Mission> = { id: mission.id, status: newStatus };
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

        for (const assignedUser of assignedUsers) {
          const updatedUserData: Partial<User> = { id: assignedUser.id, xp: assignedUser.xp + totalXpGained };
          const nextLevelXp = LEVEL_THRESHOLDS[assignedUser.level] || Infinity;
          if ((updatedUserData.xp || 0) >= nextLevelXp) updatedUserData.level = assignedUser.level + 1;
          await updateUser(assignedUser.id, updatedUserData);
          if (mission.bonusMonetario && mission.bonusMonetario > 0) {
            await createMissionBonusEvent(assignedUser.id, mission);
          }
        }
      }
      await updateMission(updatedMissionData);
      showToast('Mision actualizada', 'success');
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al actualizar la mision', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('La imagen es muy grande. El limite es 5MB.', 'error');
        return;
      }
      setNewMilestoneImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneText.trim() || isUpdating) return;

    if (mission.status === MissionStatus.PENDING && newMilestoneType !== MissionMilestoneType.BEFORE) {
      showToast('En estado pendiente solo puedes registrar evidencia de ANTES.', 'error');
      return;
    }

    if (isEvidenceType(newMilestoneType) && !newMilestoneImage) {
      showToast('Este tipo de evidencia requiere foto obligatoria.', 'error');
      return;
    }

    if (newMilestoneType === MissionMilestoneType.BEFORE && beforeMilestone) {
      showToast('Ya existe una evidencia de ANTES para esta mision.', 'error');
      return;
    }

    if (newMilestoneType === MissionMilestoneType.AFTER && mission.status !== MissionStatus.IN_PROGRESS) {
      showToast('La evidencia de DESPUES solo se registra cuando la mision esta en progreso.', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      await addMissionMilestone(mission.id, newMilestoneText, newMilestoneImage, newMilestoneType);
      showToast('Reporte registrado con exito', 'success');
      setNewMilestoneText('');
      setNewMilestoneImage(null);
      setImagePreview(null);
      setNewMilestoneType(mission.status === MissionStatus.PENDING ? MissionMilestoneType.BEFORE : MissionMilestoneType.CHECKPOINT_2H);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al anadir el hito', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleSolution = async (milestone: MissionMilestone) => {
    setIsTogglingSolution(milestone.id);
    try {
      await toggleMilestoneSolution(milestone.id, !milestone.is_solution);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al actualizar el hito', 'error');
    } finally {
      setIsTogglingSolution(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-30 p-4 animate-fadeIn">
        <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 relative max-h-[90vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
          <button onClick={onClose} className="absolute top-6 right-6 text-brand-light hover:text-white text-3xl z-10 transition-colors">&times;</button>

          <div className="flex-shrink-0 pt-2 pb-6">
            <h3 className="text-3xl font-black text-white pr-10 tracking-tight leading-tight">{mission.title}</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${mission.difficulty === 'Bajo' ? 'bg-green-500/20 text-green-400' : mission.difficulty === 'Medio' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                {mission.difficulty}
              </span>
              <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 bg-white/5 py-1 px-2 rounded-full">
                <BadgeIcon className="w-3.5 h-3.5 text-brand-blue" />
                <span>{mission.xp} XP {mission.bonusXp ? <span className="text-brand-orange">+{mission.bonusXp}</span> : ''}</span>
              </div>
            </div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl mb-6 flex-shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: 'info', label: 'Informacion' },
              { id: 'milestones', label: 'Hitos' },
              { id: 'requirements', label: 'Solicitud' },
              { id: 'supplies', label: 'Insumos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg font-bold text-xs transition-all ${activeTab === tab.id ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar relative">
            {activeTab === 'info' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-black text-brand-blue uppercase mb-3 tracking-[0.2em]">Resumen del Proyecto</h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">{mission.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-brand-blue/10 text-brand-blue"><CalendarIcon className="w-6 h-6" /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fecha Inicio</p>
                      <p className="text-sm font-black text-white">{new Date(mission.startDate + 'T00:00:00').toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-brand-red/10 text-brand-red"><FlagIcon className="w-6 h-6" /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fecha Limite</p>
                      <p className="text-sm font-black text-white">{new Date(mission.deadline + 'T00:00:00').toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-black text-brand-blue uppercase mb-4 tracking-[0.2em]">Equipo Tecnico</h4>
                  <div className="flex items-center gap-3">
                    {assignedUsers.map(u => (
                      <div key={u.id} className="group relative">
                        <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full border-2 border-slate-900 ring-2 ring-brand-blue/50 shadow-xl transition-transform hover:scale-110" />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">{u.name}</div>
                      </div>
                    ))}
                    {assignedUsers.length === 0 && <p className="text-sm text-slate-500 italic font-medium">No se han asignado tecnicos.</p>}
                  </div>
                </div>

                {mission.bonusMonetario && mission.bonusMonetario > 0 && (
                  <div className="bg-brand-green/10 p-5 rounded-2xl border border-brand-green/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-brand-green/20 text-brand-green"><CurrencyDollarIcon className="w-6 h-6" /></div>
                      <span className="text-sm font-black text-white tracking-tight">Recompensa Economica</span>
                    </div>
                    <span className="text-2xl font-black text-brand-green tabular-nums">${mission.bonusMonetario.toLocaleString('es-AR')}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'milestones' && (
              <div className="relative animate-fadeIn min-h-[300px]">
                {nextEvidenceDue && (
                  <div className={`mb-4 p-3 rounded-xl border text-xs font-bold ${nextEvidenceDue.getTime() < Date.now() ? 'border-red-400/40 bg-red-500/10 text-red-200' : 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue'}`}>
                    Proxima evidencia fotografica: {nextEvidenceDue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({nextEvidenceDue.toLocaleDateString()}).
                  </div>
                )}

                {milestonesForMission.length > 1 && (
                  <div className="absolute left-[1.25rem] top-6 bottom-6 w-[2px] bg-white/10 z-0"></div>
                )}
                <div className="space-y-8">
                  {milestonesForMission.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <BookOpenIcon className="w-12 h-12 mb-2 opacity-20" />
                      <p className="italic font-medium">No hay actualizaciones aun.</p>
                    </div>
                  )}
                  {milestonesForMission.map(milestone => {
                    const milestoneUser = usersMap.get(milestone.user_id);
                    const type = milestone.milestone_type || MissionMilestoneType.NOTE;
                    return (
                      <div key={milestone.id} className="relative flex gap-5 z-10">
                        <div className="flex-shrink-0">
                          <img src={milestoneUser?.avatar} alt={milestoneUser?.name} className="w-10 h-10 rounded-full ring-4 ring-slate-900 bg-slate-800 z-10 shadow-lg" />
                        </div>
                        <div className="flex-grow bg-white/5 p-5 rounded-2xl border border-white/5 shadow-md">
                          <div className="flex justify-between items-start mb-3 gap-3">
                            <div>
                              <span className="font-bold text-white text-sm tracking-tight">{milestoneUser?.name || 'Operario'}</span>
                              <span className="text-[10px] text-slate-500 ml-3 font-bold">{new Date(milestone.created_at).toLocaleDateString()} · {new Date(milestone.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${MILESTONE_TYPE_COLORS[type]}`}>{MILESTONE_TYPE_LABELS[type]}</span>
                              {isAdminViewing && (
                                <button
                                  onClick={() => handleToggleSolution(milestone)}
                                  disabled={isTogglingSolution === milestone.id}
                                  className={`p-1.5 rounded-full transition-all ${milestone.is_solution ? 'bg-yellow-400/20 text-yellow-400' : 'text-slate-500 hover:text-white'}`}
                                >
                                  <StarIcon className={`w-4 h-4 ${milestone.is_solution ? 'fill-current' : ''}`} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-wrap">{milestone.description}</p>
                          {milestone.image_url && (
                            <div className="mt-4 rounded-xl overflow-hidden border border-white/5 shadow-2xl bg-black/40">
                              <img src={milestone.image_url} alt="Evidencia" className="w-full h-auto max-h-[500px] object-contain cursor-zoom-in hover:scale-[1.02] transition-transform duration-500" onClick={() => window.open(milestone.image_url!, '_blank')} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'requirements' && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <h4 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] mb-1">Checklist de Proyecto</h4>
                  <p className="text-xs text-slate-500 font-medium">Elementos, materiales o herramientas que faltan conseguir o reparar.</p>
                </div>
                <RequirementsPanel mission={mission} />
              </div>
            )}

            {activeTab === 'supplies' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div>
                    <h4 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em]">Insumos de Stock</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Materiales consumibles asignados desde taller.</p>
                  </div>
                  {isAdmin && <button onClick={() => setIsAssigningSupplies(true)} className="bg-brand-blue text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95">Gestionar</button>}
                </div>
                <MissionSuppliesPanel mission={mission} canEdit={canEditSupplies} />
              </div>
            )}
          </div>

          <div className="border-t border-white/10 mt-6 pt-6 flex-shrink-0">
            {canSubmitMilestone && activeTab === 'milestones' && (
              <form onSubmit={handleAddMilestone} className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner group focus-within:border-brand-blue/50 transition-colors">
                <div className="flex gap-4">
                  <img src={currentUser?.avatar} alt={currentUser?.name} className="w-10 h-10 rounded-full ring-2 ring-white/10" />
                  <div className="flex-grow">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(mission.status === MissionStatus.PENDING
                        ? [MissionMilestoneType.BEFORE]
                        : [MissionMilestoneType.CHECKPOINT_2H, MissionMilestoneType.AFTER, MissionMilestoneType.NOTE]
                      ).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewMilestoneType(type)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${newMilestoneType === type ? MILESTONE_TYPE_COLORS[type] : 'border-white/20 text-slate-400 hover:text-white'}`}
                        >
                          {MILESTONE_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={newMilestoneText}
                      onChange={e => setNewMilestoneText(e.target.value)}
                      placeholder="Escribe una actualizacion o hito..."
                      className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none text-sm p-1 min-h-[60px]"
                      rows={2}
                      required
                    />
                    {imagePreview && (
                      <div className="relative mt-3 inline-block group/img">
                        <img src={imagePreview} alt="Preview" className="max-h-32 rounded-xl border border-white/10 shadow-2xl" />
                        <button type="button" onClick={() => { setNewMilestoneImage(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-brand-red text-white w-6 h-6 rounded-full text-sm font-bold shadow-xl flex items-center justify-center hover:scale-110 transition-transform">&times;</button>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <label className="text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 p-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 group-hover:text-slate-300">
                        <CameraIcon className="w-5 h-5" />
                        <span className="text-xs font-bold">{isEvidenceType(newMilestoneType) ? 'Foto obligatoria' : 'Adjuntar foto'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
                      </label>
                      <button
                        type="submit"
                        disabled={isUpdating || !newMilestoneText.trim()}
                        className="bg-brand-blue text-white text-xs font-black py-2.5 px-6 rounded-xl disabled:opacity-30 shadow-lg hover:shadow-brand-blue/20 transition-all active:scale-95 flex items-center gap-2"
                      >
                        {isUpdating && <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                        Publicar Reporte
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {!isAdminViewing && (
              <div className="flex gap-4 justify-center mt-2">
                {mission.status === MissionStatus.PENDING && (
                  <button
                    onClick={() => handleStatusChange(MissionStatus.IN_PROGRESS)}
                    className="bg-brand-blue text-white font-black text-sm py-3.5 px-12 rounded-2xl shadow-xl shadow-brand-blue/20 transition-all hover:scale-105 active:scale-95 hover:bg-blue-600"
                  >
                    Iniciar Proyecto
                  </button>
                )}
                {mission.status === MissionStatus.IN_PROGRESS && (
                  <button
                    onClick={() => handleStatusChange(MissionStatus.COMPLETED)}
                    className="bg-brand-green text-slate-900 font-black text-sm py-3.5 px-12 rounded-2xl shadow-xl shadow-brand-green/20 transition-all hover:scale-105 active:scale-95 hover:bg-green-500"
                  >
                    Marcar como Completado
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
