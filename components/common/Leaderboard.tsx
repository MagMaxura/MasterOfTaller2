
import React, { useMemo, useState } from 'react';
import { User, Role } from '../../types';

const Leaderboard: React.FC<{ users: User[] }> = ({ users }) => {
    const [activeRole, setActiveRole] = useState<Role>(Role.TECHNICIAN);

    const sortedUsers = useMemo(() =>
        users.filter(u => u.role === activeRole).sort((a, b) => b.xp - a.xp)
        , [users, activeRole]);

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-2xl font-bold text-center sm:text-left text-brand-orange">Ranking</h3>
                <div className="bg-brand-primary/50 p-1 rounded-lg flex text-xs font-black uppercase tracking-widest border border-brand-accent/20">
                    <button
                        onClick={() => setActiveRole(Role.TECHNICIAN)}
                        className={`px-4 py-2 rounded-md transition-colors ${activeRole === Role.TECHNICIAN ? 'bg-brand-blue text-white shadow-md' : 'text-brand-light hover:text-white'}`}
                    >
                        Técnicos
                    </button>
                    <button
                        onClick={() => setActiveRole(Role.CLEANING)}
                        className={`px-4 py-2 rounded-md transition-colors ${activeRole === Role.CLEANING ? 'bg-brand-blue text-white shadow-md' : 'text-brand-light hover:text-white'}`}
                    >
                        Limpieza
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {sortedUsers.length === 0 && (
                    <div className="text-center py-8 text-brand-light text-sm italic font-bold">No hay usuarios en esta categoría</div>
                )}
                {sortedUsers.map((user, index) => (
                    <div key={user.id} className={`flex items-center p-3 rounded-lg border ${index < 3 ? 'bg-white border-brand-accent shadow-sm' : 'bg-brand-primary/20 border-transparent hover:bg-white transition-colors'}`}>
                        <span className={`font-black text-xl w-10 text-center ${index === 0 ? 'text-yellow-500 drop-shadow-sm' : index === 1 ? 'text-slate-400 drop-shadow-sm' : index === 2 ? 'text-orange-600 drop-shadow-sm' : 'text-brand-light/50 text-sm'}`}>
                            {index + 1}
                        </span>
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mx-4 border-2 border-brand-accent object-cover bg-brand-secondary" />
                        <span className="flex-1 font-bold text-brand-highlight">{user.name}</span>
                        <span className="font-black text-[10px] uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full">{user.xp} XP</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
