import React, { useState, useMemo, memo } from 'react';
import { InventoryItem } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { PlusIcon, EditIcon } from '../../Icons';

import StockVariantManagementModal from '../modals/StockVariantManagementModal';

interface StockItemProps {
    item: InventoryItem;
    assignedCount: number;
    onUpdate: (itemId: string, newQuantity: number) => void;
    onDelete: (item: InventoryItem) => void;
    onManageVariants: (item: InventoryItem) => void;
    isUpdating: boolean;
    isDeleting: boolean;
}

const StockItem = memo<StockItemProps>(({ item, assignedCount, onUpdate, onDelete, onManageVariants, isUpdating, isDeleting }) => {
    const hasVariants = item.variants && item.variants.length > 0;
    const totalStock = hasVariants
        ? (item.variants?.reduce((sum, v) => sum + v.quantity, 0) || 0)
        : item.quantity;

    const availableCount = totalStock - assignedCount;

    const handleDirectUpdate = () => {
        const newQuantityStr = window.prompt(`Actualizar stock total para "${item.name}":`, item.quantity.toString());
        if (newQuantityStr === null) return;
        const newQuantity = parseInt(newQuantityStr, 10);
        if (isNaN(newQuantity) || newQuantity < 0) return;
        if (newQuantity < assignedCount) return;
        if (newQuantity !== item.quantity) onUpdate(item.id, newQuantity);
    };

    let stockColor = 'text-brand-highlight ring-brand-highlight/20 bg-brand-highlight/5';
    if (availableCount <= 0) {
        stockColor = 'text-brand-red ring-brand-red/20 bg-brand-red/5';
    } else if (availableCount <= 2) {
        stockColor = 'text-brand-orange ring-brand-orange/20 bg-brand-orange/5';
    }

    return (
        <div className="bg-white p-5 rounded-3xl shadow-soft hover:shadow-premium transition-all border border-brand-accent/50 group active:scale-[0.98]">
            <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-brand-secondary rounded-2xl flex items-center justify-center p-2 shadow-inner group-hover:bg-brand-blue/5 transition-colors">
                    <img src={item.icon_url} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-brand-highlight tracking-tight group-hover:text-brand-blue transition-colors truncate">{item.name}</h4>
                        {hasVariants && <span className="text-[8px] font-black bg-brand-blue text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Talles</span>}
                    </div>
                    <p className="text-[10px] text-brand-light font-bold uppercase tracking-wider mt-1 line-clamp-1 opacity-60">{item.description}</p>

                    <div className="flex items-center gap-4 mt-3">
                        <div className={`px-3 py-1.5 rounded-xl ring-1 ${stockColor} inline-flex flex-col items-center min-w-[60px]`}>
                            <span className="text-sm font-black leading-none">{availableCount}</span>
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">Libres</span>
                        </div>
                        <div className="flex flex-col text-[10px] font-bold text-brand-light/60">
                            <span>Total: {totalStock}</span>
                            <span>Uso: {assignedCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-brand-accent/30">
                {!hasVariants ? (
                    <>
                        <button
                            onClick={() => onUpdate(item.id, item.quantity - 1)}
                            disabled={isUpdating || isDeleting || item.quantity <= assignedCount}
                            className="w-11 h-11 bg-brand-accent/30 text-brand-highlight rounded-2xl flex items-center justify-center font-black hover:bg-brand-highlight hover:text-white transition-all disabled:opacity-20"
                        >
                            -
                        </button>
                        <button
                            onClick={() => onUpdate(item.id, item.quantity + 1)}
                            disabled={isUpdating || isDeleting}
                            className="w-11 h-11 bg-brand-accent/30 text-brand-highlight rounded-2xl flex items-center justify-center font-black hover:bg-brand-highlight hover:text-white transition-all disabled:opacity-20"
                        >
                            +
                        </button>
                        <button
                            onClick={handleDirectUpdate}
                            disabled={isUpdating || isDeleting}
                            className="flex-1 h-11 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all disabled:opacity-20"
                        >
                            <EditIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Ajustar</span>
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => onManageVariants(item)}
                        className="flex-1 h-11 bg-brand-highlight text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue transition-all"
                    >
                        Gestionar Inventario
                    </button>
                )}

                <button
                    onClick={() => onDelete(item)}
                    disabled={isDeleting || isUpdating}
                    className="w-11 h-11 bg-brand-red/10 text-brand-red rounded-2xl flex items-center justify-center hover:bg-brand-red hover:text-white transition-all disabled:opacity-20 translate-z-0"
                >
                    {isDeleting ? <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>}
                </button>
            </div>
            {isUpdating && (
                <div className="absolute top-4 right-4 animate-spin">
                    <div className="w-4 h-4 border-2 border-t-transparent border-brand-blue rounded-full"></div>
                </div>
            )}
        </div>
    );
});

const StockManagement: React.FC<{ onOpenCreateModal: () => void; }> = ({ onOpenCreateModal }) => {
    const { users, allInventoryItems, updateInventoryItemQuantity, deleteInventoryItem } = useData();
    const { showToast } = useToast();
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedItemForVariants, setSelectedItemForVariants] = useState<InventoryItem | null>(null);

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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black text-brand-highlight tracking-tight">Inventario de EPP</h2>
                    <p className="text-sm text-brand-light font-bold uppercase tracking-widest mt-1">Control de talles y entregas a técnicos</p>
                </div>
                <button
                    onClick={onOpenCreateModal}
                    className="w-full sm:w-auto bg-brand-highlight text-white font-black py-4 px-8 rounded-3xl flex items-center justify-center gap-3 hover:bg-brand-blue transition-all shadow-lg active:scale-95"
                >
                    <PlusIcon className="w-6 h-6" />
                    <span className="text-xs uppercase tracking-[0.2em]">Nuevo Artículo</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allInventoryItems.length === 0 ? (
                    <div className="col-span-full border-4 border-dashed border-brand-accent/50 rounded-[40px] p-20 text-center bg-white/50">
                        <p className="text-sm font-black uppercase text-brand-light tracking-widest opacity-30">No hay artículos registrados</p>
                    </div>
                ) : (
                    allInventoryItems
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(item => (
                            <StockItem
                                key={item.id}
                                item={item}
                                assignedCount={assignedCounts.get(item.id) || 0}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                                onManageVariants={setSelectedItemForVariants}
                                isUpdating={updatingIds.has(item.id)}
                                isDeleting={deletingId === item.id}
                            />
                        ))
                )}
            </div>

            {selectedItemForVariants && (
                <StockVariantManagementModal
                    isOpen={true}
                    onClose={() => setSelectedItemForVariants(null)}
                    item={selectedItemForVariants}
                />
            )}
        </div>
    );
};

export default StockManagement;