import React from 'react';
import { Badge } from '../../../types';

const BadgesPanel: React.FC<{badges: Badge[]}> = ({badges}) => (
    <div className="bg-brand-secondary p-6 rounded-lg shadow-lg h-full">
        <h4 className="text-xl font-bold mb-4 text-center">Insignias</h4>
         {badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
                {badges.map(badge => (
                    <div key={badge.id} className="flex flex-col items-center text-center group" title={`${badge.name}: ${badge.description}`}>
                        <img src={badge.icon} alt={badge.name} className="w-16 h-16 mx-auto rounded-full bg-brand-accent p-1 transition-transform group-hover:scale-110"/>
                        <p className="text-xs mt-2 break-words">{badge.name}</p>
                    </div>
                ))}
            </div>
        ) : <p className="text-brand-light text-center italic mt-8">Aún no has ganado insignias.</p>}
    </div>
);

export default BadgesPanel;
