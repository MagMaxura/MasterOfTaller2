import React, { useState, useMemo, memo } from 'react';
import { InventoryItem } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { PlusIcon, EditIcon } from '../../Icons';

interface StockItemProps {
    item: InventoryItem;
    assignedCount: number;
    onUpdate: (itemId: string, newQuantity: number) => void;
    onDelete: (item: InventoryItem) => void;
    isUpdating: boolean;
    isDeleting: boolean;
}

const StockItem = memo<StockItemProps>(({ item, assignedCount, onUpdate, onDelete, isUpdating, isDeleting }) => {
    const availableCount = item.quantity - assignedCount;

    const handleDirectUpdate = () => {
        const newQuantityStr = window.prompt(`Actualizar stock total para "${item.name}":`, item.quantity.toString());
        if (newQuantityStr === null) return;
        const newQuantity = parseInt(newQuantityStr, 10);
        if (isNaN(newQuantity) || newQuantity < 0) {
             alert("Por favor, introduce un número válido y no negativo.");
             return;
        }
        if (newQuantity < assignedCount) {
             alert(`No se puede reducir el stock total (${newQuantity}) por debajo del número de insumos ya asignados (${assignedCount}).`);
             return;
        }
        if (newQuantity !== item.quantity) onUpdate(item.id, newQuantity);
    };
    
    let stockColor = 'text-brand-highlight';
    if (availableCount <= 0) {
        stockColor = 'text-brand-red';
    } else if (availableCount <= 2) {
        stockColor = 'text-brand-orange';
    }

    return (
        <div className="flex items-center justify-between bg-brand-primary p-3 rounded-lg flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <img src={item.icon_url} alt={item.name} className="w-10 h-10 bg-brand-accent p-1 rounded flex-shrink-0 object-contain"/>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-brand-light truncate">{item.description}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className={`text-center px-2 py-1 rounded ${stockColor.replace('text-', 'bg-')}/20 mr-2`}>
                    <p className={`font-bold text-lg ${stockColor}`}>{availableCount}</p>
                    <p className="text-xs text-brand-light">Disponibles</p>
                </div>
                <div className="text-xs text-center text-brand-light mr-2">
                    <p>Total: {item.quantity}</p>
                    <p>Asignados: {assignedCount}</p>
                </div>
                <button onClick={() => onUpdate(item.id, item.quantity - 1)} disabled={isUpdating || isDeleting || item.quantity <= assignedCount} className="px-3 py-1 bg-brand-accent rounded hover:bg-brand-light disabled:opacity-50">-</button>
                <button onClick={() => onUpdate(item.id, item.quantity + 1)} disabled={isUpdating || isDeleting} className="px-3 py-1 bg-brand-accent rounded hover:bg-brand-light disabled:opacity-50">+</button>
                <button onClick={handleDirectUpdate} disabled={isUpdating || isDeleting} className="p-2 bg-brand-light text-brand-primary rounded hover:bg-brand-highlight disabled:opacity-50" title="Editar stock total"><EditIcon className="w-5 h-5" /></button>
                {(isUpdating) && <div className="w-5 h-5 border-2 border-t-transparent border-brand-blue rounded-full animate-spin"></div>}
                <div className="w-px h-6 bg-brand-accent mx-2"></div>
                <button onClick={() => onDelete(item)} disabled={isDeleting || isUpdating} className="p-2 bg-brand-red text-white rounded hover:bg-red-700 disabled:opacity-50" title="Eliminar Insumo">
                    {isDeleting ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>}
                </button>
            </div>
        </div>
    );
});

const StockManagement: React.FC<{ onOpenCreateModal: () => void; }> = ({ onOpenCreateModal }) => {
    const { users, allInventoryItems, updateInventoryItemQuantity, deleteInventoryItem } = useData();
    const { showToast } = useToast();
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const assignedCounts = useMemo(() => {
        const counts = new Map<string, number>();
        users.forEach(user => {
            user.inventory.forEach(invItem => {
                counts.set(invItem.item.id, (counts.get(invItem.item.id) || 0) + 1);
            });
        });
        return counts;
    }, [users]);

    const handleUpdate = async (itemId: string, newQuantity: number) => {
        setUpdatingIds(prev => new Set(prev).add(itemId));
        await updateInventoryItemQuantity(itemId, newQuantity);
        setUpdatingIds(prev => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
        });
    };

    const handleDelete = async (item: InventoryItem) => {
        const assigned = assignedCounts.get(item.id) || 0;
        if (assigned > 0) {
            showToast(`No se puede eliminar "${item.name}" porque está asignado a ${assigned} técnico(s).`, 'error');
            return;
        }
        if (window.confirm(`¿Estás seguro de que quieres eliminar "${item.name}"? Esta acción es irreversible.`)) {
            setDeletingId(item.id);
            try {
                await deleteInventoryItem(item.id, item.icon_url);
                showToast("Insumo eliminado", 'success');
            } catch (error) {
                showToast(error instanceof Error ? error.message : "No se pudo eliminar el insumo", 'error');
            } finally {
                setDeletingId(null);
            }
        }
    };

    return (
        <div className="bg-brand-secondary p-6 rounded-lg">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold">Gestión de Stock</h3>
                 <button onClick={onOpenCreateModal} className="bg-brand-green text-brand-primary font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-green-300"><PlusIcon className="w-5 h-5" />Crear Insumo</button>
            </div>
            <div className="space-y-3">
                {allInventoryItems.length === 0 && <p className="text-brand-light italic text-center p-8">No hay insumos. ¡Crea el primero!</p>}
                {allInventoryItems.sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                    <StockItem 
                        key={item.id} 
                        item={item} 
                        assignedCount={assignedCounts.get(item.id) || 0}
                        onUpdate={handleUpdate} 
                        onDelete={handleDelete} 
                        isUpdating={updatingIds.has(item.id)} 
                        isDeleting={deletingId === item.id} 
                    />
                ))}
            </div>
        </div>
    );
};

export default StockManagement;