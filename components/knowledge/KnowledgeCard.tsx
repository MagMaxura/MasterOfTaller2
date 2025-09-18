import React, { useMemo } from 'react';
import { MissionMilestone, User } from '../../types';
import { useData } from '../../contexts/DataContext';

interface KnowledgeCardProps {
    milestone: MissionMilestone;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ milestone }) => {
    const { users } = useData();
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const author = usersMap.get(milestone.user_id);

    return (
        <div className="bg-brand-primary rounded-lg overflow-hidden shadow-lg flex flex-col h-full">
            {milestone.image_url && (
                <img src={milestone.image_url} alt="Hito" className="w-full h-48 object-cover" />
            )}
            <div className="p-4 flex flex-col flex-grow">
                <p className="text-brand-light mb-4 flex-grow">{milestone.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {milestone.mission?.required_skills?.map(skill => (
                        <span key={skill} className="px-2 py-1 text-xs bg-brand-accent rounded-full">{skill}</span>
                    ))}
                </div>

                <div className="border-t border-brand-accent pt-3 mt-auto">
                     <p className="text-xs text-brand-accent mb-2">
                        De la misión: <span className="font-semibold text-brand-light hover:underline cursor-pointer">{milestone.mission?.title}</span>
                    </p>
                    <div className="flex items-center">
                        {author ? (
                            <img src={author.avatar} alt={author.name} className="w-8 h-8 rounded-full mr-3" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-accent mr-3"></div>
                        )}
                        <div>
                            <p className="font-semibold text-sm">{author?.name || 'Usuario desconocido'}</p>
                            <p className="text-xs text-brand-light">{new Date(milestone.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeCard;