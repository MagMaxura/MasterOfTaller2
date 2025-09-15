import React from 'react';
import { Skill } from '../../../types';
import ProgressBar from '../../common/ProgressBar';

const SkillsPanel: React.FC<{skills: Skill[]}> = ({skills}) => (
    <div className="bg-brand-secondary p-6 rounded-lg shadow-lg h-full">
        <h4 className="text-xl font-bold mb-4 text-center">Habilidades</h4>
        <div className="space-y-4">
            {skills.length > 0 ? skills.sort((a, b) => b.level - a.level).map(skill => (
                <div key={skill.id}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">{skill.name}</span>
                        <span className="text-sm text-brand-light">{skill.level}/100</span>
                    </div>
                    <ProgressBar value={skill.level} max={100} colorClass="bg-brand-green" />
                </div>
            )) : <p className="text-brand-light text-center italic mt-8">Aún no has desarrollado habilidades.</p>}
        </div>
    </div>
);

export default SkillsPanel;
