import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { Mission, MissionSupply } from '../../types';
import { QuestionMarkIcon } from '../Icons';

interface GroupedSupplies {
    mission: Mission;
    supplies: MissionSupply[];
}

const SupplyRow: React.FC<{ missionSupply: MissionSupply }> = ({ missionSupply }) => {
    const { updateMissionSupply } = useData();
    const { showToast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentUsed, setCurrentUsed] = useState(missionSupply.quantity_used);

    const handleUsageChange = async () => {
        if (currentUsed < 0 || currentUsed > missionSupply.quantity_assigned) {
            showToast("La cantidad usada no puede ser negativa o mayor a la asignada.", 'error');
            setCurrentUsed(missionSupply.quantity_used); // Reset on invalid input
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
            <img
                src={missionSupply.supplies.photo_url || 'https://placehold.co/64x64/1b263b/e0e1dd?text=?'}
                alt={missionSupply.supplies.model}
                className="w-12 h-12 object-cover rounded-md flex-shrink-0"
            />
            <div className="flex-grow">
                <p className="font-bold">{missionSupply.supplies.type} - {missionSupply.supplies.model}</p>
                <p className="text-xs text-brand-light">{missionSupply.supplies.general_category} &gt; {missionSupply.supplies.specific_category}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm">Usados:</span>
                <input
                    type="number"
                    value={currentUsed}
                    onChange={(e) => setCurrentUsed(parseInt(e.target.value, 10) || 0)}
                    onBlur={handleUsageChange}
                    min="0"
                    max={missionSupply.quantity_assigned}
                    disabled={isUpdating}
                    className="w-20 bg-brand-secondary p-1 rounded border border-brand-accent text-center"
                />
                <span className="text-sm text-brand-light">/ {missionSupply.quantity_assigned}</span>
                {isUpdating && <div className="w-5 h-5 border-2 border-t-transparent border-brand-blue rounded-full animate-spin"></div>}
            </div>
        </div>
    );
};

const TechnicianSuppliesView: React.FC = () => {
    const { currentUser, missions, missionSupplies } = useData();
    const [showHelp, setShowHelp] = useState(false);

    const groupedSupplies = useMemo<GroupedSupplies[]>(() => {
        if (!currentUser) return [];

        const userMissions = missions.filter(m => m.assignedTo?.includes(currentUser.id));

        return userMissions.map(mission => {
            const suppliesForMission = missionSupplies.filter(ms => ms.mission_id === mission.id);
            return { mission, supplies: suppliesForMission };
        }).filter(group => group.supplies.length > 0)
            .sort((a, b) => new Date(b.mission.startDate).getTime() - new Date(a.mission.startDate).getTime());

    }, [currentUser, missions, missionSupplies]);

    if (!currentUser) return null;

    return (
        <div className="bg-brand-secondary p-4 md:p-6 rounded-lg shadow-xl">
            <div className="flex flex-col items-center text-center space-y-1 mb-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-brand-highlight tracking-tight">Gestión de Insumos</h2>
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className={`p-1 rounded-full transition-colors ${showHelp ? 'bg-brand-blue/10 text-brand-blue' : 'text-brand-light hover:bg-brand-accent'}`}
                        title="Mostrar ayuda"
                    >
                        <QuestionMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                {showHelp && (
                    <p className="text-[11px] text-brand-light max-w-sm animate-fadeIn bg-brand-accent/20 p-2 rounded-lg border border-brand-accent/30">
                        Aquí puedes ver y actualizar el uso de insumos para todas las misiones que tienes asignadas.
                    </p>
                )}
            </div>

            {groupedSupplies.length === 0 && (
                <div className="text-center text-brand-light italic p-8 bg-brand-primary rounded-lg">
                    No tienes insumos asignados en ninguna de tus misiones activas.
                </div>
            )}

            <div className="space-y-6">
                {groupedSupplies.map(({ mission, supplies }) => (
                    <div key={mission.id} className="bg-brand-primary/50 p-4 rounded-lg">
                        <h3 className="text-xl font-bold mb-3 border-b border-brand-accent pb-2">{mission.title}</h3>
                        <div className="space-y-3">
                            {supplies.map(ms => <SupplyRow key={ms.id} missionSupply={ms} />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TechnicianSuppliesView;