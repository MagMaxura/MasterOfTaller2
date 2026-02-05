
import React, { useMemo } from 'react';
import { User, Role } from '../../types';

const Leaderboard: React.FC<{users: User[]}> = ({users}) => {
    const sortedUsers = useMemo(() => users.filter(u => u.role === Role.TECHNICIAN).sort((a,b) => b.xp - a.xp), [users]);
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-center text-brand-orange">Clasificación de Maestros</h3>
            <div className="space-y-2">
                {sortedUsers.map((user, index) => (
                    <div key={user.id} className={`flex items-center p-3 rounded-lg border ${index < 3 ? 'bg-white border-brand-accent shadow-sm' : 'bg-transparent border-transparent'}`}>
                        <span className={`font-bold text-lg w-10 text-center ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-500' : index === 2 ? 'text-orange-700' : 'text-brand-light'}`}>
                            {index + 1}
                        </span>
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mx-4 border border-brand-accent" />
                        <span className="flex-1 font-semibold text-brand-highlight">{user.name}</span>
                        <span className="font-bold text-brand-blue">{user.xp} XP</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
