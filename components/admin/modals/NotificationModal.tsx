import React, { useState } from 'react';
import { User } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';

const NotificationModal: React.FC<{
    user: User;
    onClose: () => void;
}> = ({ user, onClose }) => {
    const { sendNotification, showToast } = useAppContext();
    const [title, setTitle] = useState(`Mensaje para ${user.name}`);
    const [body, setBody] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            showToast('El título y el mensaje no pueden estar vacíos.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await sendNotification(user.id, title, body);
            showToast('¡Notificación enviada con éxito!', 'success');
            setTimeout(onClose, 1500);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al enviar la notificación.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-brand-secondary rounded-lg max-w-lg w-full p-6 relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-6">Enviar Notificación a {user.name}</h3>
                <div className="space-y-4">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-blue" required />
                    <textarea placeholder="Ej: Por favor, sube una foto de tu progreso..." value={body} onChange={e => setBody(e.target.value)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent h-24" required></textarea>
                    <button type="submit" disabled={isLoading} className="w-full mt-4 bg-brand-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                        {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                        {isLoading ? 'Enviando...' : 'Enviar Notificación'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NotificationModal;
