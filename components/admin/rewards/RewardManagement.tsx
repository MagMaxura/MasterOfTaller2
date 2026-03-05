import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Reward } from '../../../types';
import * as Icons from '../../Icons';
import RewardModal from '../modals/RewardModal';

const RewardManagement: React.FC = () => {
    const { rewardItems, addReward, updateReward, deleteReward } = useData();
    const [selectedReward, setSelectedReward] = useState<Reward | undefined>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getIcon = (iconName: string) => {
        const IconComponent = (Icons as any)[iconName];
        return IconComponent ? <IconComponent className="w-6 h-6" /> : <Icons.StarIcon className="w-6 h-6" />;
    };

    const handleCreate = () => {
        setSelectedReward(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (reward: Reward) => {
        setSelectedReward(reward);
        setIsModalOpen(true);
    };

    const handleSave = async (data: Omit<Reward, 'id' | 'created_at'>) => {
        if (selectedReward) {
            await updateReward(selectedReward.id, data);
        } else {
            await addReward(data);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-brand-highlight">Gestión de Recompensas</h2>
                    <p className="text-brand-light text-sm">Administra los premios de la Tienda de Recompensas</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Icons.PlusIcon className="w-5 h-5" />
                    Nueva Recompensa
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-premium border border-brand-accent overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-brand-primary border-b border-brand-accent">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-brand-light uppercase tracking-wider">Premio</th>
                            <th className="px-6 py-4 text-xs font-black text-brand-light uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-4 text-xs font-black text-brand-light uppercase tracking-wider text-center">Costo</th>
                            <th className="px-6 py-4 text-xs font-black text-brand-light uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent">
                        {rewardItems.map((reward) => (
                            <tr key={reward.id} className="hover:bg-brand-primary/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-brand-blue shadow-sm">
                                            {getIcon(reward.icon)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-brand-highlight">{reward.name}</div>
                                            <div className="text-xs text-brand-light truncate max-w-xs">{reward.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-brand-accent text-brand-light">
                                        {reward.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="font-black text-brand-blue">{reward.cost} pts</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(reward)}
                                            className="p-2 rounded-lg hover:bg-brand-blue hover:text-white text-brand-light transition-all"
                                            title="Editar"
                                        >
                                            <Icons.EditIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteReward(reward.id)}
                                            className="p-2 rounded-lg hover:bg-red-500 hover:text-white text-brand-light transition-all"
                                            title="Eliminar"
                                        >
                                            <Icons.TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <RewardModal
                    reward={selectedReward}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default RewardManagement;
