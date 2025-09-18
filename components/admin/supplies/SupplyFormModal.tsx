import React, { useState } from 'react';
import { Supply } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { BoxIcon } from '../../Icons';

interface SupplyFormModalProps {
    supply: Supply | null;
    onClose: () => void;
}

const SupplyFormModal: React.FC<SupplyFormModalProps> = ({ supply, onClose }) => {
    const { addSupply, updateSupply } = useData();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        general_category: supply?.general_category || '',
        specific_category: supply?.specific_category || '',
        type: supply?.type || '',
        model: supply?.model || '',
        details: supply?.details || '',
        stock_quantity: supply?.stock_quantity || 0,
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(supply?.photo_url || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('La imagen es muy grande. El límite es 2MB.');
                return;
            }
            setError('');
            setPhotoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { general_category, specific_category, type, model } = formData;
        if (!general_category || !specific_category || !type || !model) {
            setError('Todos los campos marcados con * son requeridos.');
            return;
        }
        if (!supply && !photoFile) {
            setError('Se requiere una foto para crear un nuevo insumo.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            if (supply) {
                await updateSupply(supply.id, formData, photoFile);
                showToast('Insumo actualizado.', 'success');
            } else {
                await addSupply({ ...formData, photo_url: null }, photoFile);
                showToast('Insumo creado.', 'success');
            }
            onClose();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Ocurrió un error.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-brand-secondary rounded-lg max-w-2xl w-full p-6 relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-6">{supply ? 'Editar' : 'Crear'} Insumo</h3>
                {error && <p className="bg-brand-red/20 text-brand-red p-2 rounded-md mb-4 text-sm">{error}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <input type="text" name="general_category" placeholder="Categoría General *" value={formData.general_category} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                        <input type="text" name="specific_category" placeholder="Categoría Particular *" value={formData.specific_category} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                        <input type="text" name="type" placeholder="Tipo *" value={formData.type} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                        <input type="text" name="model" placeholder="Modelo *" value={formData.model} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                    </div>
                    <div className="space-y-4">
                        <textarea name="details" placeholder="Detalles adicionales" value={formData.details} onChange={handleChange} className="w-full bg-brand-primary p-3 rounded border border-brand-accent h-24"></textarea>
                        <label className="w-full h-40 flex flex-col items-center justify-center bg-brand-primary p-3 rounded border-2 border-dashed border-brand-accent cursor-pointer hover:border-brand-blue">
                            {previewUrl ? <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" /> : <div className="text-center text-brand-light"><BoxIcon className="w-10 h-10 mx-auto mb-2" /><span>Subir Foto *</span></div>}
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>
                
                <button type="submit" disabled={isLoading} className="w-full mt-6 bg-brand-green text-brand-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                    {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                    {isLoading ? 'Guardando...' : 'Guardar Insumo'}
                </button>
            </form>
        </div>
    );
};

export default SupplyFormModal;