import React, { useState, useMemo } from 'react';
import { Supply } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { PlusIcon } from '../../Icons';
import SupplyFormModal from './SupplyFormModal';

const SuppliesManagement: React.FC = () => {
    const { supplies, missionSupplies, updateSupply, deleteSupply } = useData();
    const { showToast } = useToast();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const assignedQuantities = useMemo(() => {
        const counts = new Map<string, number>();
        missionSupplies.forEach(ms => {
            counts.set(ms.supply_id, (counts.get(ms.supply_id) || 0) + ms.quantity_assigned);
        });
        return counts;
    }, [missionSupplies]);

    const filteredSupplies = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return supplies;
        return supplies.filter(supply => 
            supply.general_category.toLowerCase().includes(lowercasedFilter) ||
            supply.specific_category.toLowerCase().includes(lowercasedFilter) ||
            supply.type.toLowerCase().includes(lowercasedFilter) ||
            supply.model.toLowerCase().includes(lowercasedFilter) ||
            (supply.details && supply.details.toLowerCase().includes(lowercasedFilter))
        );
    }, [supplies, searchTerm]);

    const handleEdit = (supply: Supply) => {
        setEditingSupply(supply);
        setIsFormModalOpen(true);
    };

    const handleCreate = () => {
        setEditingSupply(null);
        setIsFormModalOpen(true);
    };

    const handleDelete = async (supply: Supply) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar "${supply.type} ${supply.model}"? Esta acción es irreversible.`)) {
            setIsLoading(prev => ({ ...prev, [supply.id]: true }));
            try {
                await deleteSupply(supply);
                showToast('Insumo eliminado.', 'success');
            } catch (error) {
                showToast(error instanceof Error ? error.message : "Error al eliminar.", 'error');
            } finally {
                setIsLoading(prev => ({ ...prev, [supply.id]: false }));
            }
        }
    };

    const handleUpdateStock = async (supply: Supply, newStock: number) => {
        const assigned = assignedQuantities.get(supply.id) || 0;
        if (newStock < assigned) {
            showToast(`No se puede reducir el stock por debajo de la cantidad ya asignada a misiones (${assigned}).`, 'error');
            return;
        }
        setIsLoading(prev => ({ ...prev, [supply.id]: true }));
        try {
            await updateSupply(supply.id, { stock_quantity: newStock }, null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al actualizar stock.", 'error');
        } finally {
             setIsLoading(prev => ({ ...prev, [supply.id]: false }));
        }
    }

    return (
        <>
            <div className="bg-brand-secondary p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h3 className="text-xl font-bold">Gestión de Insumos</h3>
                    <button onClick={handleCreate} className="bg-brand-green text-brand-primary font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-green-300">
                        <PlusIcon className="w-5 h-5" />Crear Insumo
                    </button>
                </div>
                 <div className="mb-4">
                    <input
                        type="search"
                        placeholder="Buscar por modelo, categoría, tipo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-brand-primary p-3 rounded-lg border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-brand-accent">
                                <th className="p-3">Foto</th>
                                <th className="p-3">Tipo / Modelo</th>
                                <th className="p-3">Categoría</th>
                                <th className="p-3 max-w-xs">Detalles</th>
                                <th className="p-3 text-center">Stock Total</th>
                                <th className="p-3 text-center">Asignado</th>
                                <th className="p-3 text-center">Disponible</th>
                                <th className="p-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSupplies.map(supply => {
                                const assigned = assignedQuantities.get(supply.id) || 0;
                                const available = supply.stock_quantity - assigned;
                                let stockColor = 'text-brand-highlight';
                                if (available <= 0) stockColor = 'text-brand-red';
                                else if (available <= 2) stockColor = 'text-brand-orange';

                                return (
                                <tr key={supply.id} className="border-b border-brand-accent/50 hover:bg-brand-primary">
                                    <td className="p-3"><img src={supply.photo_url || 'https://placehold.co/64x64/1b263b/e0e1dd?text=?'} alt={supply.model} className="w-12 h-12 object-cover rounded-md" /></td>
                                    <td className="p-3">{supply.type}<br/><span className="text-xs text-brand-light">{supply.model}</span></td>
                                    <td className="p-3">{supply.general_category}<br/><span className="text-xs text-brand-light">{supply.specific_category}</span></td>
                                    <td className="p-3 max-w-xs truncate text-sm text-brand-light" title={supply.details || ''}>{supply.details || 'N/A'}</td>
                                    <td className="p-3 text-center">
                                        <input 
                                            type="number" 
                                            value={supply.stock_quantity}
                                            onChange={(e) => handleUpdateStock(supply, parseInt(e.target.value, 10) || 0)}
                                            className="w-20 bg-brand-secondary p-1 rounded border border-brand-accent text-center"
                                            disabled={isLoading[supply.id]}
                                        />
                                    </td>
                                    <td className="p-3 text-center font-semibold">{assigned}</td>
                                    <td className={`p-3 text-center font-bold text-lg ${stockColor}`}>{available}</td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(supply)} className="bg-brand-blue text-white px-3 py-1 rounded text-sm">Editar</button>
                                            <button onClick={() => handleDelete(supply)} disabled={isLoading[supply.id]} className="bg-brand-red text-white px-3 py-1 rounded text-sm disabled:opacity-50">
                                                {isLoading[supply.id] ? '...' : 'Eliminar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                {filteredSupplies.length === 0 && <p className="text-center text-brand-light italic p-8">{supplies.length > 0 ? 'No se encontraron resultados para tu búsqueda.' : 'No hay insumos creados.'}</p>}
            </div>
            {isFormModalOpen && <SupplyFormModal supply={editingSupply} onClose={() => setIsFormModalOpen(false)} />}
        </>
    );
};

export default SuppliesManagement;