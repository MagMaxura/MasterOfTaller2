import React, { useState, useMemo } from 'react';
import { User, InventoryItem, UserInventoryItem } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';
import RemoveItemConfirmationModal from './RemoveItemConfirmationModal';

const InventoryManagementModal: React.FC<{ user: User; onClose: () => void; }> = ({ user, onClose }) => {
    const { users, allInventoryItems, assignInventoryItem, showToast } = useAppContext();
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [confirmingRemove, setConfirmingRemove] = useState<UserInventoryItem | null>(null);

    const assignedCounts = useMemo(() => {
        const counts = new Map<string, number>();
        users.forEach(u => {
            u.inventory.forEach(invItem => {
                counts.set(invItem.item.id, (counts.get(invItem.item.id) || 0) + 1);
            });
        });
        return counts;
    }, [users]);

    const handleAssign = async (item: InventoryItem) => {
        const assigned = assignedCounts.get(item.id) || 0;
        if (assigned >= item.quantity) {
            showToast(`No hay stock disponible para "${item.name}".`, 'error');
            return;
        }

        setLoading(prev => ({ ...prev, [`assign-${item.id}`]: true }));
        try {
            await assignInventoryItem(user.id, item.id);
            showToast('Insumo asignado.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al asignar insumo.", 'error');
        } finally {
            setLoading(prev => ({ ...prev, [`assign-${item.id}`]: false }));
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-secondary rounded-lg max-w-4xl w-full p-6 relative flex flex-col max-h-[90vh]">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-4">Gestionar Inventario de {user.name}</h3>
                <div className="grid md:grid-cols-2 gap-6 flex-grow overflow-hidden">
                    {/* Assigned Inventory */}
                    <div className="bg-brand-primary p-4 rounded-lg flex flex-col"><h4 className="font-bold mb-3 text-lg">Inventario Asignado</h4><div className="space-y-2 overflow-y-auto">
                        {user.inventory.length === 0 && <p className="text-brand-light italic text-center p-4">Este técnico no tiene insumos asignados.</p>}
                        {user.inventory.map((userInvItem) => (
                            <div key={userInvItem.id} className="flex items-center bg-brand-secondary p-2 rounded">
                                <img src={userInvItem.item.icon_url} alt={userInvItem.item.name} className="w-8 h-8 rounded mr-3"/>
                                <span className="flex-grow font-semibold">{userInvItem.item.name}</span>
                                <button onClick={() => setConfirmingRemove(userInvItem)} className="bg-brand-red text-white px-3 py-1 text-sm rounded hover:bg-red-700 disabled:opacity-50">
                                    Quitar
                                </button>
                            </div>
                        ))}
                    </div></div>

                    {/* Available Items */}
                    <div className="bg-brand-primary p-4 rounded-lg flex flex-col"><h4 className="font-bold mb-3 text-lg">Asignar Insumos</h4><div className="space-y-2 overflow-y-auto">
                        {allInventoryItems.length === 0 && <p className="text-brand-light italic text-center p-4">No hay insumos en stock.</p>}
                        {allInventoryItems.sort((a,b) => a.name.localeCompare(b.name)).map(item => {
                             const assigned = assignedCounts.get(item.id) || 0;
                             const available = item.quantity - assigned;
                             return (
                                 <div key={item.id} className={`flex items-center bg-brand-secondary p-2 rounded ${available <= 0 ? 'opacity-60' : ''}`}>
                                    <img src={item.icon_url} alt={item.name} className="w-8 h-8 rounded mr-3 object-contain"/>
                                    <span className="flex-grow font-semibold">{item.name} <span className="text-xs text-brand-light">(Disponibles: {available}/{item.quantity})</span></span>
                                    <button onClick={() => handleAssign(item)} disabled={loading[`assign-${item.id}`] || available <= 0} className="bg-brand-green text-brand-primary px-3 py-1 text-sm rounded hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                         {loading[`assign-${item.id}`] ? '...' : 'Asignar'}
                                    </button>
                                </div>
                             );
                         })}
                    </div></div>
                </div>
            </div>
            {confirmingRemove && <RemoveItemConfirmationModal itemToRemove={confirmingRemove} onClose={() => setConfirmingRemove(null)} />}
        </div>
    );
};

export default InventoryManagementModal;