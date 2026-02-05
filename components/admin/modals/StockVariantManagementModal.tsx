import React, { useState } from 'react';
import { InventoryItem } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';

interface StockVariantManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem;
}

const StockVariantManagementModal: React.FC<StockVariantManagementModalProps> = ({ isOpen, onClose, item }) => {
    const { updateInventoryVariantQuantity } = useData();
    const { showToast } = useToast();
    const [updatingVariantId, setUpdatingVariantId] = useState<string | null>(null);

    // Initial state handling isn't strictly necessary if we read directly from item, 
    // but if we want inputs to be editable, we might need local state.
    // simpler approach: just use uncontrolled inputs or simple state per row is hard.
    // Let's rely on the item prop being up to date via parent re-render, 
    // but for smooth input editing we normally need local state. 
    // However, for stock management, usually simple + / - buttons or a prompt is enough.
    // Let's implement + / - buttons and an edit button like the main stock view.

    if (!isOpen) return null;

    const handleUpdate = async (variantId: string, newQuantity: number) => {
        if (newQuantity < 0) return;
        setUpdatingVariantId(variantId);
        try {
            await updateInventoryVariantQuantity(variantId, newQuantity);
            // We assume parent will re-render or we should trigger a refresh?
            // The context usually handles refresh via realtime or manual fetch.
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Error al actualizar', 'error');
        } finally {
            setUpdatingVariantId(null);
        }
    };

    const handleDirectUpdate = (variantId: string, currentQty: number, size: string) => {
        const newQtyStr = window.prompt(`Nuevo stock para Talle ${size}:`, currentQty.toString());
        if (newQtyStr === null) return;
        const newQty = parseInt(newQtyStr, 10);
        if (isNaN(newQty) || newQty < 0) {
            alert("Número inválido");
            return;
        }
        handleUpdate(variantId, newQty);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-secondary p-6 rounded-lg shadow-xl w-full max-w-lg border border-brand-accent">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Gestionar Talles: {item.name}</h3>
                    <button onClick={onClose} className="text-brand-light hover:text-white text-2xl">&times;</button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto space-y-3">
                    {item.variants?.sort((a, b) => a.size.localeCompare(b.size)).map(variant => (
                        <div key={variant.id} className="flex justify-between items-center bg-brand-primary p-3 rounded border border-white/5">
                            <span className="font-bold text-lg w-16 text-center">{variant.size}</span>

                            <div className="flex items-center gap-2">
                                <span className="text-brand-light text-sm mr-2">Stock:</span>
                                <span className={`font-mono text-xl w-12 text-center ${variant.quantity === 0 ? 'text-brand-red' : 'text-brand-highlight'}`}>
                                    {variant.quantity}
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleUpdate(variant.id, variant.quantity - 1)}
                                    disabled={updatingVariantId === variant.id || variant.quantity <= 0}
                                    className="w-8 h-8 rounded bg-brand-accent hover:bg-brand-light flex items-center justify-center disabled:opacity-50"
                                >-</button>
                                <button
                                    onClick={() => handleUpdate(variant.id, variant.quantity + 1)}
                                    disabled={updatingVariantId === variant.id}
                                    className="w-8 h-8 rounded bg-brand-accent hover:bg-brand-light flex items-center justify-center disabled:opacity-50"
                                >+</button>
                                <button
                                    onClick={() => handleDirectUpdate(variant.id, variant.quantity, variant.size)}
                                    disabled={updatingVariantId === variant.id}
                                    className="px-3 h-8 rounded bg-brand-light text-brand-primary hover:bg-white disabled:opacity-50 text-sm font-bold"
                                >Edit</button>
                                {updatingVariantId === variant.id && <div className="w-4 h-4 rounded-full border-2 border-brand-accent border-t-transparent animate-spin ml-2"></div>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-brand-accent rounded text-brand-primary font-bold hover:bg-brand-light transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockVariantManagementModal;
