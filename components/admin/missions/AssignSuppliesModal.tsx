import React, { useState, useMemo } from 'react';
import { Mission, Supply } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';

interface AssignSuppliesModalProps {
    mission: Mission;
    onClose: () => void;
}

const AssignSuppliesModal: React.FC<AssignSuppliesModalProps> = ({ mission, onClose }) => {
    const { supplies, missionSupplies, assignSupplyToMission, removeSupplyFromMission, updateMissionSupply } = useData();
    const { showToast } = useToast();
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [assignQuantities, setAssignQuantities] = useState<Record<string, number | string>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const suppliesForThisMission = useMemo(() => {
        return missionSupplies.filter(ms => ms.mission_id === mission.id);
    }, [missionSupplies, mission.id]);

    const totalAssignedQuantitiesToAllMissions = useMemo(() => {
        const counts = new Map<string, number>();
        missionSupplies.forEach(ms => {
            counts.set(ms.supply_id, (counts.get(ms.supply_id) || 0) + ms.quantity_assigned);
        });
        return counts;
    }, [missionSupplies]);

    const filteredAvailableSupplies = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const baseSupplies = supplies.sort((a, b) => a.type.localeCompare(b.type));
        if (!lowercasedFilter) return baseSupplies;
        return baseSupplies.filter(supply => 
            supply.general_category.toLowerCase().includes(lowercasedFilter) ||
            supply.specific_category.toLowerCase().includes(lowercasedFilter) ||
            supply.type.toLowerCase().includes(lowercasedFilter) ||
            supply.model.toLowerCase().includes(lowercasedFilter) ||
            (supply.details && supply.details.toLowerCase().includes(lowercasedFilter))
        );
    }, [supplies, searchTerm]);

    const handleAssign = async (supply: Supply) => {
        const quantityToAdd = Number(assignQuantities[supply.id] || 1);
        const totalAssigned = totalAssignedQuantitiesToAllMissions.get(supply.id) || 0;
        const availableStock = supply.stock_quantity - totalAssigned;

        if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
            showToast("La cantidad debe ser un número válido mayor a cero.", 'error');
            return;
        }
        if (quantityToAdd > availableStock) {
            showToast(`No puedes asignar más de lo disponible en stock (${availableStock}).`, 'error');
            return;
        }

        setLoading(prev => ({ ...prev, [supply.id]: true }));
        try {
            const existingAssignment = suppliesForThisMission.find(ms => ms.supply_id === supply.id);

            if (existingAssignment) {
                // UPDATE existing assignment
                const newQuantity = existingAssignment.quantity_assigned + quantityToAdd;
                await updateMissionSupply(existingAssignment.id, { quantity_assigned: newQuantity });
                showToast('Cantidad de insumo actualizada.', 'success');
            } else {
                // INSERT new assignment
                await assignSupplyToMission(mission.id, supply.id, quantityToAdd);
                showToast('Insumo asignado.', 'success');
            }
            
            setAssignQuantities(prev => ({ ...prev, [supply.id]: '1' })); // Reset to 1
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al asignar.", 'error');
        } finally {
            setLoading(prev => ({ ...prev, [supply.id]: false }));
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

    const handleQuantityChange = (supply: Supply, valueStr: string) => {
        if (valueStr === '') {
            setAssignQuantities(prev => ({ ...prev, [supply.id]: ''}));
            return;
        }
        
        const totalAssigned = totalAssignedQuantitiesToAllMissions.get(supply.id) || 0;
        const availableStock = supply.stock_quantity - totalAssigned;
        let value = parseInt(valueStr, 10);

        if (!isNaN(value)) {
            if (value < 1) value = 1;
            if (value > availableStock) value = availableStock;
            setAssignQuantities(prev => ({ ...prev, [supply.id]: value }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-secondary rounded-lg max-w-4xl w-full p-6 relative flex flex-col max-h-[90vh]">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-4">Gestionar Insumos para "{mission.title}"</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden">
                    {/* Assigned Supplies */}
                    <div className="bg-brand-primary p-4 rounded-lg flex flex-col"><h4 className="font-bold mb-3 text-lg">Insumos Asignados</h4><div className="space-y-2 overflow-y-auto">
                        {suppliesForThisMission.length === 0 && <p className="text-brand-light italic text-center p-4">No hay insumos asignados.</p>}
                        {suppliesForThisMission.map((ms) => (
                            <div key={ms.id} className="flex items-center bg-brand-secondary p-2 rounded gap-3">
                                <img src={ms.supplies.photo_url || 'https://placehold.co/64x64/1b263b/e0e1dd?text=?'} alt={ms.supplies.model} className="w-10 h-10 rounded object-cover flex-shrink-0"/>
                                <div className="flex-grow">
                                    <p className="font-semibold">{ms.supplies.type} - {ms.supplies.model}</p>
                                    <p className="text-xs text-brand-light">Asignados: {ms.quantity_assigned}</p>
                                </div>
                                <button onClick={() => handleRemove(ms.id)} disabled={loading[ms.id]} className="bg-brand-red text-white px-3 py-1 text-sm rounded hover:bg-red-700 disabled:opacity-50">
                                    {loading[ms.id] ? '...' : 'Quitar'}
                                </button>
                            </div>
                        ))}
                    </div></div>

                    {/* Available Supplies */}
                    <div className="bg-brand-primary p-4 rounded-lg flex flex-col">
                        <h4 className="font-bold text-lg">Insumos Disponibles</h4>
                        <div className="my-3">
                            <input
                                type="search"
                                placeholder="Buscar por modelo, categoría, tipo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-brand-secondary p-2 rounded-lg border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            />
                        </div>
                        <div className="space-y-2 overflow-y-auto">
                            {filteredAvailableSupplies.length === 0 && (
                                <p className="text-brand-light italic text-center p-4">
                                    {supplies.length > 0 ? 'No se encontraron insumos.' : 'No hay insumos en stock.'}
                                </p>
                            )}
                            {filteredAvailableSupplies.map(supply => {
                                const totalAssigned = totalAssignedQuantitiesToAllMissions.get(supply.id) || 0;
                                const availableStock = supply.stock_quantity - totalAssigned;
                                const isAlreadyAssigned = suppliesForThisMission.some(ms => ms.supply_id === supply.id);
                                return (
                                    <div key={supply.id} className={`flex items-center bg-brand-secondary p-2 rounded gap-2 ${availableStock <= 0 ? 'opacity-50' : ''} ${isAlreadyAssigned ? 'ring-2 ring-brand-blue/50' : ''}`}>
                                        <img src={supply.photo_url || 'https://placehold.co/64x64/1b263b/e0e1dd?text=?'} alt={supply.model} className="w-10 h-10 rounded mr-2 object-cover flex-shrink-0"/>
                                        <div className="flex-grow">
                                            <p className="font-semibold">{supply.type} - {supply.model}</p>
                                            <p className="text-xs text-brand-light">Stock Disponible: {availableStock}</p>
                                        </div>
                                        <input
                                            type="number"
                                            value={assignQuantities[supply.id] ?? '1'}
                                            onChange={(e) => handleQuantityChange(supply, e.target.value)}
                                            onBlur={(e) => { if(e.target.value === '') setAssignQuantities(prev => ({ ...prev, [supply.id]: 1})) }}
                                            min="1"
                                            max={availableStock}
                                            disabled={availableStock <= 0}
                                            className="w-16 bg-brand-primary p-2 rounded border border-brand-accent text-center"
                                            aria-label={`Cantidad para ${supply.model}`}
                                        />
                                        <button 
                                            onClick={() => handleAssign(supply)} 
                                            disabled={loading[supply.id] || availableStock <= 0 || assignQuantities[supply.id] === ''} 
                                            className="bg-brand-green text-brand-primary px-3 py-2 text-sm font-bold rounded hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed w-28 text-center"
                                        >
                                            {loading[supply.id] ? '...' : (isAlreadyAssigned ? 'Añadir Más' : 'Asignar')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignSuppliesModal;
