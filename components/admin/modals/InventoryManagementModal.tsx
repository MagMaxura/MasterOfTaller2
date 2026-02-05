import React, { useState, useMemo } from 'react';
import { User, InventoryItem, UserInventoryItem } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import RemoveItemConfirmationModal from './RemoveItemConfirmationModal';

const InventoryManagementModal: React.FC<{ user: User; onClose: () => void; }> = ({ user, onClose }) => {
    const { users, allInventoryItems, assignInventoryItem } = useData();
    const { showToast } = useToast();
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [confirmingRemove, setConfirmingRemove] = useState<UserInventoryItem | null>(null);
    const [selectedItemForVariant, setSelectedItemForVariant] = useState<InventoryItem | null>(null);

    const { assignedCounts, variantAssignedCounts } = useMemo(() => {
        const itemCounts = new Map<string, number>();
        const variantCounts = new Map<string, number>();
        users.forEach(u => {
            u.inventory.forEach(invItem => {
                itemCounts.set(invItem.item.id, (itemCounts.get(invItem.item.id) || 0) + 1);
                if (invItem.variant_id) {
                    variantCounts.set(invItem.variant_id, (variantCounts.get(invItem.variant_id) || 0) + 1);
                }
            });
        });
        return { assignedCounts: itemCounts, variantAssignedCounts: variantCounts };
    }, [users]);

    const handleAssign = async (item: InventoryItem, variantId?: string) => {
        // If item has variants and no variantId is provided, open the selector
        if (!variantId && item.variants && item.variants.length > 0) {
            setSelectedItemForVariant(item);
            return;
        }

        // Validate stock
        if (variantId) {
            const variant = item.variants?.find(v => v.id === variantId);
            if (!variant) return;
            const assigned = variantAssignedCounts.get(variantId) || 0;
            if (assigned >= variant.quantity) {
                showToast(`No hay stock disponible para el talle ${variant.size}.`, 'error');
                return;
            }
        } else {
            const assigned = assignedCounts.get(item.id) || 0;
            // Only check general stock if NOT using variants (legacy or non-sized items)
            // If item has variants but we are here (maybe inconsistent data?), fallback to quantity
            if (assigned >= item.quantity) {
                showToast(`No hay stock disponible para "${item.name}".`, 'error');
                return;
            }
        }

        setLoading(prev => ({ ...prev, [`assign-${item.id}`]: true }));
        try {
            await assignInventoryItem(user.id, item.id, variantId);
            showToast('Insumo asignado.', 'success');
            setSelectedItemForVariant(null);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden">
                    {/* Assigned Inventory */}
                    <div className="bg-brand-primary p-4 rounded-lg flex flex-col"><h4 className="font-bold mb-3 text-lg">Inventario Asignado</h4><div className="space-y-2 overflow-y-auto">
                        {user.inventory.length === 0 && <p className="text-brand-light italic text-center p-4">Este técnico no tiene insumos asignados.</p>}
                        {user.inventory.map((userInvItem) => (
                            <div key={userInvItem.id} className="flex items-center bg-brand-secondary p-2 rounded">
                                <img src={userInvItem.item.icon_url} alt={userInvItem.item.name} className="w-8 h-8 rounded mr-3" />
                                <div className="flex-grow">
                                    <span className="font-semibold block">{userInvItem.item.name}</span>
                                    {userInvItem.variant && <span className="text-sm text-brand-light">Talle: {userInvItem.variant.size} ({userInvItem.variant.size})</span>}
                                    {/* Fallback explanation if variant object is missing but ID exists? No, relying on context loading */}
                                </div>
                                <button onClick={() => setConfirmingRemove(userInvItem)} className="bg-brand-red text-white px-3 py-1 text-sm rounded hover:bg-red-700 disabled:opacity-50">
                                    Quitar
                                </button>
                            </div>
                        ))}
                    </div></div>

                    {/* Available Items */}
                    <div className="bg-brand-primary p-4 rounded-lg flex flex-col"><h4 className="font-bold mb-3 text-lg">Asignar Insumos</h4><div className="space-y-2 overflow-y-auto">
                        {allInventoryItems.length === 0 && <p className="text-brand-light italic text-center p-4">No hay insumos en stock.</p>}
                        {allInventoryItems.sort((a, b) => a.name.localeCompare(b.name)).map(item => {
                            const hasVariants = item.variants && item.variants.length > 0;

                            // Visual Stock Display Logic
                            let availableDisplay = "";
                            let isOutOfStock = false;

                            if (hasVariants) {
                                // Sum of all variant stocks
                                const totalCapacity = item.variants!.reduce((sum, v) => sum + v.quantity, 0);
                                const totalAssigned = item.variants!.reduce((sum, v) => sum + (variantAssignedCounts.get(v.id) || 0), 0);
                                const totalAvailable = totalCapacity - totalAssigned;
                                availableDisplay = `${totalAvailable} un. (Variantes)`;
                                isOutOfStock = totalAvailable <= 0;
                            } else {
                                const assigned = assignedCounts.get(item.id) || 0;
                                const available = item.quantity - assigned;
                                availableDisplay = `${available}/${item.quantity}`;
                                isOutOfStock = available <= 0;
                            }

                            return (
                                <div key={item.id} className={`flex items-center bg-brand-secondary p-2 rounded ${isOutOfStock ? 'opacity-60' : ''}`}>
                                    <img src={item.icon_url} alt={item.name} className="w-8 h-8 rounded mr-3 object-contain" />
                                    <span className="flex-grow font-semibold">{item.name} <span className="text-xs text-brand-light">(Disp: {availableDisplay})</span></span>
                                    <button onClick={() => handleAssign(item)} disabled={loading[`assign-${item.id}`] || isOutOfStock} className="bg-brand-green text-brand-primary px-3 py-1 text-sm rounded hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {loading[`assign-${item.id}`] ? '...' : 'Asignar'}
                                    </button>
                                </div>
                            );
                        })}
                    </div></div>
                </div>
            </div>

            {/* Variant Selection Modal */}
            {selectedItemForVariant && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
                    <div className="bg-brand-secondary rounded-lg max-w-md w-full p-6">
                        <h4 className="text-xl font-bold mb-4">Seleccionar Talle para {selectedItemForVariant.name}</h4>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {selectedItemForVariant.variants?.sort((a, b) => {
                                // Try to sort numerically if possible, else alphabetically
                                const numA = parseInt(a.size);
                                const numB = parseInt(b.size);
                                if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                                return a.size.localeCompare(b.size);
                            }).map(v => {
                                const assigned = variantAssignedCounts.get(v.id) || 0;
                                const available = v.quantity - assigned;
                                return (
                                    <button key={v.id}
                                        onClick={() => handleAssign(selectedItemForVariant, v.id)}
                                        disabled={available <= 0}
                                        className={`p-3 rounded text-center border ${available > 0 ? 'border-brand-accent hover:bg-brand-accent hover:text-white' : 'border-gray-600 opacity-50 cursor-not-allowed'}`}
                                    >
                                        <div className="font-bold text-lg">{v.size}</div>
                                        <div className="text-xs text-gray-400">Stock: {available}</div>
                                    </button>
                                );
                            })}
                        </div>
                        <button onClick={() => setSelectedItemForVariant(null)} className="w-full bg-gray-600 py-2 rounded hover:bg-gray-500">Cancelar</button>
                    </div>
                </div>
            )}

            {confirmingRemove && <RemoveItemConfirmationModal itemToRemove={confirmingRemove} onClose={() => setConfirmingRemove(null)} />}
        </div>
    );
};

export default InventoryManagementModal;
