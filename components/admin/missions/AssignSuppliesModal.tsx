import React, { useState, useMemo } from 'react';
import { Mission, Supply, MissionSupply } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';

interface AssignSuppliesModalProps {
    mission: Mission;
    onClose: () => void;
}

const AssignSuppliesModal: React.FC<AssignSuppliesModalProps> = ({ mission, onClose }) => {
    const { supplies, missionSupplies, assignSupplyToMission, removeSupplyFromMission, updateMissionSupply, showToast } = useAppContext();
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    
    const suppliesForMission = useMemo(() => {
        return missionSupplies.filter(ms => ms.mission_id === mission.id);
    }, [missionSupplies, mission.id]);

    const availableSupplies = useMemo(() => {
        const assignedIds = new Set(suppliesForMission.map(ms => ms.supply_id));
        return supplies.filter(s => !assignedIds.has(s.id));
    }, [supplies, suppliesForMission]);
    
    const handleAssign = async (supplyId: string) => {
        const quantityStr = prompt(`¿Qué cantidad de "${supplies.find(s=>s.id === supplyId)?.model}" deseas asignar?`);
        if (!quantityStr) return;
        const quantity = parseInt(quantityStr, 10);
        if (isNaN(quantity) || quantity <= 0) {
            showToast("Por favor, introduce una cantidad válida.", 'error');
            return;
        }

        setLoading(prev => ({ ...prev, [supplyId]: true }));
        try {
            await assignSupplyToMission(mission.id, supplyId, quantity);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al asignar.", 'error');
        } finally {
            setLoading(prev => ({ ...prev, [supplyId]: false }));
        }
    };

    const handleRemove = async (missionSupplyId: string) => {
        if (!window.confirm("¿Quitar este insumo de la misión?")) return;
        setLoading(prev => ({ ...prev, [missionSupplyId]: true }));
        try {
            await removeSupplyFromMission(missionSupplyId);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al quitar.", 'error');
        } finally {
            setLoading(prev => ({ ...prev, [missionSupplyId]: false }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-secondary rounded-lg max-w-4xl w-full p-6 relative flex flex-col max-h-[90vh]">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-4">Gestionar Insumos para "{mission.title}"</h3>
                <div className="grid md:grid-cols-2 gap-6 flex-grow overflow-hidden">
                    <div className="bg-brand-primary p-4 rounded-lg flex flex-col"><h4 className="font-bold mb-3 text-lg">Insumos Asignados</h4><div className="space-y-2 overflow-y-auto">
                        {suppliesForMission.length === 0 && <p className="text-brand-light italic text-center p-4">No hay insumos asignados.</p>}
                        {suppliesForMission.map((ms) => (
                            <div key={ms.id} className="flex items-center bg-brand-secondary p-2 rounded">
                                <img src={ms.supplies.photo_url || ''} alt={ms.supplies.model} className="w-10 h-10 rounded mr-3"/>
                                <span className="flex-grow font-semibold">{ms.supplies.type} - {ms.supplies.model}</span>
                                <span className="mr-4">Asignados: {ms.quantity_assigned}</span>
                                <button onClick={() => handleRemove(ms.id)} disabled={loading[ms.id]} className="bg-brand-red text-white px-3 py-1 text-sm rounded hover:bg-red-700 disabled:opacity-50">
                                    {loading[ms.id] ? '...' : 'Quitar'}
                                </button>
                            </div>
                        ))}
                    </div></div>

                    <div className="bg-brand-primary p-4 rounded-lg flex flex-col"><h4 className="font-bold mb-3 text-lg">Insumos Disponibles</h4><div className="space-y-2 overflow-y-auto">
                        {availableSupplies.map(supply => (
                             <div key={supply.id} className="flex items-center bg-brand-secondary p-2 rounded">
                                <img src={supply.photo_url || ''} alt={supply.model} className="w-10 h-10 rounded mr-3 object-contain"/>
                                <div className="flex-grow">
                                    <p className="font-semibold">{supply.type} - {supply.model}</p>
                                    <p className="text-xs text-brand-light">Stock: {supply.stock_quantity}</p>
                                </div>
                                <button onClick={() => handleAssign(supply.id)} disabled={loading[supply.id]} className="bg-brand-green text-brand-primary px-3 py-1 text-sm rounded hover:bg-green-300 disabled:opacity-50">
                                     {loading[supply.id] ? '...' : 'Asignar'}
                                </button>
                            </div>
                        ))}
                    </div></div>
                </div>
            </div>
        </div>
    );
};

export default AssignSuppliesModal;
