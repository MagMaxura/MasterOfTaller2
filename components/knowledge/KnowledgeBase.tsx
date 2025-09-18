import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import KnowledgeCard from './KnowledgeCard';

const KnowledgeBase: React.FC = () => {
    const { missionMilestones, missions } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());

    const allSkills = useMemo(() => {
        const skills = new Set<string>();
        missions.forEach(m => m.skills.forEach(skill => skills.add(skill)));
        return Array.from(skills).sort();
    }, [missions]);

    const handleSkillToggle = (skill: string) => {
        setSelectedSkills(prev => {
            const newSet = new Set(prev);
            if (newSet.has(skill)) {
                newSet.delete(skill);
            } else {
                newSet.add(skill);
            }
            return newSet;
        });
    };

    const filteredMilestones = useMemo(() => {
        return missionMilestones
            .filter(milestone => milestone.is_solution) // Only show curated solutions
            .filter(milestone => {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = searchLower === '' ||
                    milestone.description.toLowerCase().includes(searchLower) ||
                    milestone.mission?.title.toLowerCase().includes(searchLower);

                if (!matchesSearch) return false;

                const hasAllSelectedSkills = selectedSkills.size === 0 ||
                    Array.from(selectedSkills).every(skill =>
                        milestone.mission?.required_skills.includes(skill)
                    );
                
                return hasAllSelectedSkills;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [missionMilestones, searchTerm, selectedSkills]);


    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold mb-4 text-center">Base de Conocimiento</h2>
            <p className="text-center text-brand-light mb-6 max-w-2xl mx-auto">
                Busca en el conocimiento colectivo del equipo. Cada hito es una solución o un aprendizaje de una misión pasada.
            </p>

            {/* Search and Filter Controls */}
            <div className="sticky top-[6.5rem] bg-brand-secondary z-10 py-4 mb-6">
                 <input
                    type="search"
                    placeholder="Buscar por palabra clave (ej: 'freno', 'sensor', 'ruido')..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-primary p-3 rounded-lg border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-blue mb-4"
                />
                <div className="flex flex-wrap gap-2 justify-center">
                    {allSkills.map(skill => (
                        <button
                            key={skill}
                            onClick={() => handleSkillToggle(skill)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedSkills.has(skill) ? 'bg-brand-blue text-white' : 'bg-brand-accent hover:bg-brand-light hover:text-brand-primary'}`}
                        >
                            {skill}
                        </button>
                    ))}
                </div>
            </div>

            {/* Knowledge Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMilestones.length > 0 ? (
                    filteredMilestones.map(milestone => (
                        <KnowledgeCard key={milestone.id} milestone={milestone} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-16 bg-brand-primary rounded-lg">
                        <p className="text-brand-light italic">No se encontraron resultados para tu búsqueda. El administrador puede añadir más conocimiento desde los detalles de cada misión.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBase;