import React, { useState } from 'react';
import { UserInventoryItem } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';

interface RemoveItemConfirmationModalProps {
    itemToRemove: UserInventoryItem;
    onClose: () => void;
}

const RemoveItemConfirmationModal: React.FC<RemoveItemConfirmationModalProps> = ({ itemToRemove, onClose }) => {
    const { removeInventoryItem, disposeOfInventoryItem } = useData();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState<'return' | 'dispose' | null>(null);

    const handleReturnToStock = async () => {
        setIsLoading('return');
        try {
            await removeInventoryItem(itemToRemove.id);
            showToast(`"${itemToRemove.item.name}" devuelto al stock.`, 'success');
            onClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al devolver al stock.", 'error');
            setIsLoading(null);
        }
    };

    const handleDispose = async () => {
        setIsLoading('dispose');
        try {
            await disposeOfInventoryItem(itemToRemove.id, itemToRemove.item.id);
            showToast(`"${itemToRemove.item.name}" fue tirado y removido del stock.`, 'success');
            onClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al tirar el insumo.", 'error');
            setIsLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="bg-brand-secondary rounded-lg max-w-md w-full p-6 relative">
                <h3 className="text-2xl font-bold mb-4 text-center">Quitar Insumo</h3>
                <p className="text-center text-brand-light mb-6">
                    ¿Qué deseas hacer con <span className="font-bold text-white">{itemToRemove.item.name}</span>?
                </p>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleReturnToStock}
                        disabled={!!isLoading}
                        className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent hover:bg-blue-700 transition-colors"
                    >
                        {isLoading === 'return' && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                        Devolver a Stock (Reutilizable)
                    </button>
                    <button
                        onClick={handleDispose}
                        disabled={!!isLoading}
                        className="w-full bg-brand-red text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent hover:bg-red-700 transition-colors"
                    >
                        {isLoading === 'dispose' && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                        Tirar (Roto o Descartado)
                    </button>
                </div>
                 <button type="button" onClick={onClose} disabled={!!isLoading} className="w-full text-brand-light text-center mt-6 hover:text-white disabled:opacity-50">Cancelar</button>
            </div>
        </div>
    );
};

export default RemoveItemConfirmationModal;