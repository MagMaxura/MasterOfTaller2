import React from 'react';
import { useData } from '../../../contexts/DataContext';
import { Reward } from '../../../types';
import * as Icons from '../../Icons';

const RewardStore: React.FC = () => {
    const { rewardItems, purchaseReward, currentUser } = useData();

    const getIcon = (iconName: string) => {
        const IconComponent = (Icons as any)[iconName];
        return IconComponent ? <IconComponent className="w-8 h-8" /> : <Icons.StarIcon className="w-8 h-8" />;
    };

    const handlePurchase = async (reward: Reward) => {
        if (window.confirm(`¿Seguro que quieres canjear "${reward.name}" por ${reward.cost} Puntos de Éxito?`)) {
            await purchaseReward(reward);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Tienda de Recompensas</h2>
                <div className="bg-brand-blue text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                    <Icons.StarIcon className="w-5 h-5 text-yellow-300" />
                    <span className="font-bold">{currentUser?.success_points || 0} Puntos</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewardItems.map((reward) => {
                    const canAfford = (currentUser?.success_points || 0) >= reward.cost;
                    return (
                        <div
                            key={reward.id}
                            className={`bg-white rounded-2xl p-6 shadow-premium border border-brand-accent transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${!canAfford ? 'opacity-75' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-brand-primary text-brand-blue`}>
                                    {getIcon(reward.icon)}
                                </div>
                                <div className="bg-brand-accent px-3 py-1 rounded-full text-xs font-bold text-brand-light">
                                    {reward.cost} pts
                                </div>
                            </div>

                            <h3 className="text-lg font-bold mb-2 text-brand-highlight">{reward.name}</h3>
                            <p className="text-sm text-brand-light mb-6 line-clamp-2">{reward.description}</p>

                            <button
                                onClick={() => handlePurchase(reward)}
                                disabled={!canAfford}
                                className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${canAfford
                                        ? 'bg-brand-blue text-white shadow-lg hover:shadow-blue-500/30'
                                        : 'bg-brand-accent/50 text-brand-light cursor-not-allowed'
                                    }`}
                            >
                                {canAfford ? 'Canjear Ahora' : 'Faltan Puntos'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RewardStore;
