import React from 'react';
import { User } from '../../types';
import { LEVEL_THRESHOLDS } from '../../config';
import { useAppContext } from '../../contexts/AppContext';
import { ArrowLeftIcon, LogoutIcon } from '../Icons';
import ProgressBar from '../common/ProgressBar';

const Header: React.FC<{ user: User; isAdminViewing?: boolean; onBack?: () => void; }> = ({ user, isAdminViewing, onBack }) => {
    const { handleLogout } = useAppContext();
    const nextLevelXp = LEVEL_THRESHOLDS[user.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const currentLevelXp = LEVEL_THRESHOLDS[user.level - 1] || 0;
    const levelProgress = user.xp - currentLevelXp;
    const xpForNextLevel = nextLevelXp - currentLevelXp;
    
    return (
        <header className="bg-brand-secondary p-4 flex items-center justify-between shadow-lg sticky top-0 z-20 h-16">
            <div className="flex items-center gap-4">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-brand-blue" />
                <div>
                    <h2 className="font-bold text-lg">{user.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-brand-light">
                        <span>Nivel: {user.level}</span>
                        <div className="w-32">
                            <ProgressBar value={levelProgress} max={xpForNextLevel} colorClass="bg-brand-orange" />
                        </div>
                        <span>{user.xp} / {nextLevelXp} XP</span>
                    </div>
                </div>
            </div>
            {isAdminViewing && onBack ? (
                 <button onClick={onBack} className="flex items-center gap-2 bg-brand-light text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-brand-highlight transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Volver</span>
                </button>
            ) : (
                <button onClick={handleLogout} className="flex items-center gap-2 bg-brand-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                    <LogoutIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Salir</span>
                </button>
            )}
        </header>
    );
};

export default Header;
