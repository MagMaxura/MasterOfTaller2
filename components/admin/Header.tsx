import React from 'react';
import { User } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { LogoutIcon } from '../Icons';

const Header: React.FC<{ user: User; }> = ({ user }) => {
    const { handleLogout } = useAppContext();
    return (
    <header className="bg-brand-secondary p-4 flex items-center justify-between shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-brand-orange" />
            <div>
                <h2 className="font-bold text-lg">{user.name}</h2>
                <p className="text-sm text-brand-light">General Supremo del Ejército</p>
            </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-brand-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
            <LogoutIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Salir</span>
        </button>
    </header>
)};

export default Header;