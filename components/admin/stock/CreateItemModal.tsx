import React, { useState } from 'react';
import { EquipmentSlot } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';
import { BoxIcon } from '../../Icons';

const CreateItemModal: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    const { addInventoryItem, showToast } = useAppContext();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [slot, setSlot] = useState<EquipmentSlot>(EquipmentSlot.SHIRT);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('La imagen es muy grande. El límite es 2MB.');
                return;
            }
            setError('');
            setIconFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !description.trim() || !iconFile) {
            setError('Todos los campos y la imagen son requeridos.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await addInventoryItem({ name, description, slot, quantity }, iconFile);
            showToast("Insumo creado con éxito", "success");
            onClose();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Ocurrió un error desconocido.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-brand-secondary rounded-lg max-w-lg w-full p-6 relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-6">Crear Nuevo Insumo</h3>
                {error && <p className="bg-brand-red/20 text-brand-red p-2 rounded-md mb-4 text-sm">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <input type="text" placeholder="Nombre del insumo" value={name} onChange={e => setName(e.target.value)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-blue" required />
                        <textarea placeholder="Descripción corta" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent h-24" required></textarea>
                        <input type="number" placeholder="Stock inicial" value={quantity} onChange={e => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))} min="0" className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                    </div>
                    <div className="space-y-4">
                        <select value={slot} onChange={e => setSlot(e.target.value as EquipmentSlot)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent">
                            {Object.values(EquipmentSlot).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                        <label className="w-full h-40 flex flex-col items-center justify-center bg-brand-primary p-3 rounded border-2 border-dashed border-brand-accent cursor-pointer hover:border-brand-blue">
                            {previewUrl ? <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" /> : <div className="text-center text-brand-light"><BoxIcon className="w-10 h-10 mx-auto mb-2" /><span>Subir Ícono (PNG, 2MB max)</span></div>}
                            <input type="file" accept="image/png" className="hidden" onChange={handleFileChange} required />
                        </label>
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full mt-6 bg-brand-green text-brand-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                    {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                    {isLoading ? 'Creando...' : 'Crear Insumo'}
                </button>
            </form>
        </div>
    );
};

export default CreateItemModal;
