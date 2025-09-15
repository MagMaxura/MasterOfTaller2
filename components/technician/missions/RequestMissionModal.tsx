import React, { useState } from 'react';
import { useAppContext } from '../../../contexts/AppContext';

const RequestMissionModal: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    const { requestMission, showToast } = useAppContext();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            showToast('El título y la descripción son requeridos.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await requestMission(title, description);
            onClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error al enviar la solicitud.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-secondary rounded-lg max-w-lg w-full p-6 relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-6">Solicitar Nueva Misión</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Título de la misión (ej: 'Reparar freno trasero de Ford Ranger')"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-brand-primary p-3 rounded border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        required
                    />
                    <textarea
                        placeholder="Describe la tarea que necesitas realizar..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-brand-primary p-3 rounded border border-brand-accent h-32"
                        required
                    ></textarea>
                    <button type="submit" disabled={isLoading} className="w-full mt-4 bg-brand-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                        {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                        {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RequestMissionModal;
