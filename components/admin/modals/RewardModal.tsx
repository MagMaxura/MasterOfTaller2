import React, { useState } from 'react';
import { Reward } from '../../../types';
import * as Icons from '../../Icons';

interface RewardModalProps {
    reward?: Reward;
    onClose: () => void;
    onSave: (data: Omit<Reward, 'id' | 'created_at'>) => Promise<void>;
}

const RewardModal: React.FC<RewardModalProps> = ({ reward, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: reward?.name || '',
        description: reward?.description || '',
        cost: reward?.cost || 0,
        icon: reward?.icon || 'StarIcon',
        type: reward?.type || 'XP'
    });
    const [loading, setLoading] = useState(false);

    const availableIcons = Object.keys(Icons).filter(key => key.endsWith('Icon'));
    const rewardTypes = ['ATTENDANCE', 'FLEX', 'INVENTORY', 'XP', 'SOCIAL', 'LEAVE', 'MONETARY'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-brand-secondary rounded-2xl w-full max-w-md p-6 shadow-2xl border border-brand-accent animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{reward ? 'Editar Recompensa' : 'Nueva Recompensa'}</h2>
                    <button onClick={onClose} className="text-brand-light hover:text-white text-2xl transition-colors">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-brand-light uppercase mb-1">Nombre</label>
                        <input
                            type="text"
                            className="w-full bg-brand-primary p-3 rounded-xl border border-brand-accent focus:ring-2 focus:ring-brand-blue outline-none"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand-light uppercase mb-1">Descripción</label>
                        <textarea
                            className="w-full bg-brand-primary p-3 rounded-xl border border-brand-accent focus:ring-2 focus:ring-brand-blue outline-none h-24 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-brand-light uppercase mb-1">Costo (pts)</label>
                            <input
                                type="number"
                                className="w-full bg-brand-primary p-3 rounded-xl border border-brand-accent focus:ring-2 focus:ring-brand-blue outline-none"
                                value={formData.cost}
                                onChange={e => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                                required
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-light uppercase mb-1">Tipo</label>
                            <select
                                className="w-full bg-brand-primary p-3 rounded-xl border border-brand-accent focus:ring-2 focus:ring-brand-blue outline-none appearance-none"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                {rewardTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand-light uppercase mb-1">Icono</label>
                        <select
                            className="w-full bg-brand-primary p-3 rounded-xl border border-brand-accent focus:ring-2 focus:ring-brand-blue outline-none appearance-none"
                            value={formData.icon}
                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                        >
                            {availableIcons.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-brand-blue text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (reward ? 'Guardar Cambios' : 'Crear Recompensa')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RewardModal;
