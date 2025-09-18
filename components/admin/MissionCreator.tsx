import React, { useState } from 'react';
import { User, Role, MissionDifficulty, MissionStatus } from '../../types';
import { GeneratedMissionData, generateMissionIdea } from '../../services/geminiService';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { AiIcon } from '../Icons';

const MissionCreator: React.FC<{ users: User[] }> = ({ users }) => {
    const { addMission } = useData();
    const { showToast } = useToast();
    const [missionData, setMissionData] = useState<Partial<GeneratedMissionData>>({ title: '', description: '', difficulty: MissionDifficulty.MEDIUM, xp: 50, skills: [] });
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [deadline, setDeadline] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [aiKeywords, setAiKeywords] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [error, setError] = useState('');
    const [visibleTo, setVisibleTo] = useState<string[]>([]);

    const technicians = users.filter(u => u.role === Role.TECHNICIAN);

    const handleGenerateWithAI = async () => {
        if (!aiKeywords.trim()) {
            setError('Por favor, ingresa palabras clave para la IA.');
            return;
        }
        setError('');
        setIsAiLoading(true);
        try {
            const idea = await generateMissionIdea(aiKeywords);
            setMissionData(idea);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al generar idea.', 'error');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        if (selectedId && !assignedTo.includes(selectedId)) {
            setAssignedTo([...assignedTo, selectedId]);
        }
    };

    const removeAssignee = (id: string) => {
        setAssignedTo(assignedTo.filter(techId => techId !== id));
    };
    
    const handleVisibilityChange = (technicianId: string) => {
        setVisibleTo(prev => 
            prev.includes(technicianId) 
                ? prev.filter(id => id !== technicianId) 
                : [...prev, technicianId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!missionData.title || !missionData.description || !startDate || !deadline) {
            setError('Todos los campos son obligatorios, excepto el técnico asignado.');
            return;
        }
        if (new Date(deadline) < new Date(startDate)) {
            setError('La fecha límite no puede ser anterior a la fecha de inicio.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await addMission({
                title: missionData.title,
                description: missionData.description,
                difficulty: missionData.difficulty || MissionDifficulty.MEDIUM,
                xp: missionData.xp || 50,
                assignedTo: assignedTo.length > 0 ? assignedTo : null,
                startDate,
                deadline,
                skills: missionData.skills || [],
                visibleTo,
            });
            showToast('¡Misión creada con éxito!', 'success');
            // Reset form
            setMissionData({ title: '', description: '', difficulty: MissionDifficulty.MEDIUM, xp: 50, skills: [] });
            setAssignedTo([]);
            setStartDate(new Date().toISOString().split('T')[0]);
            setDeadline('');
            setAiKeywords('');
            setVisibleTo([]);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al crear la misión.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const assignedUsers = assignedTo.map(id => technicians.find(t => t.id === id)).filter(Boolean);

    return (
        <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-lg shadow-xl space-y-6">
            <h3 className="text-2xl font-bold text-center">Crear Nueva Misión</h3>
            {error && <p className="bg-brand-red/20 text-brand-red p-2 rounded-md text-sm">{error}</p>}

            <div className="bg-brand-primary p-4 rounded-lg">
                <label htmlFor="ai-keywords" className="block font-semibold mb-2">Generar con IA (Opcional)</label>
                <div className="flex gap-2">
                    <input id="ai-keywords" type="text" value={aiKeywords} onChange={e => setAiKeywords(e.target.value)} placeholder="Ej: cambiar aceite, filtro de aire, toyota corolla" className="flex-grow bg-brand-secondary p-3 rounded-l-lg border border-brand-accent" />
                    <button type="button" onClick={handleGenerateWithAI} disabled={isAiLoading} className="bg-brand-orange text-brand-primary font-bold py-2 px-4 rounded-r-lg flex items-center gap-2 disabled:bg-brand-accent">
                        {isAiLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <AiIcon />}
                        <span className="hidden sm:inline">Generar</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <input type="text" placeholder="Título de la Misión" value={missionData.title || ''} onChange={e => setMissionData(d => ({ ...d, title: e.target.value }))} className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                <div>
                     <select onChange={handleAssigneeChange} value="" className="w-full bg-brand-primary p-3 rounded border border-brand-accent mb-2">
                        <option value="">Asignar técnico...</option>
                        {technicians.filter(t => !assignedTo.includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2">
                        {assignedUsers.map(user => user && (
                            <div key={user.id} className="bg-brand-blue/50 text-white flex items-center gap-2 px-2 py-1 rounded-full text-sm">
                                <img src={user.avatar} className="w-5 h-5 rounded-full" />
                                <span>{user.name}</span>
                                <button type="button" onClick={() => removeAssignee(user.id)} className="text-red-300 hover:text-white">&times;</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <textarea placeholder="Descripción detallada de la misión..." value={missionData.description || ''} onChange={e => setMissionData(d => ({ ...d, description: e.target.value }))} className="w-full bg-brand-primary p-3 rounded border border-brand-accent h-28" required />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium text-brand-light mb-1">Fecha de Inicio</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                <div><label className="block text-sm font-medium text-brand-light mb-1">Fecha Límite</label><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                <div><label className="block text-sm font-medium text-brand-light mb-1">Dificultad</label><select value={missionData.difficulty} onChange={e => setMissionData(d => ({ ...d, difficulty: e.target.value as MissionDifficulty }))} className="w-full bg-brand-primary p-3 rounded border border-brand-accent"><option value={MissionDifficulty.LOW}>Bajo</option><option value={MissionDifficulty.MEDIUM}>Medio</option><option value={MissionDifficulty.HIGH}>Alto</option></select></div>
                <div><label className="block text-sm font-medium text-brand-light mb-1">XP</label><input type="number" value={missionData.xp || 0} onChange={e => setMissionData(d => ({ ...d, xp: parseInt(e.target.value, 10) || 0 }))} min="0" className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
            </div>
            
            <div className="col-span-full">
                <label className="block font-semibold mb-2">Visible para Técnicos</label>
                <div className="bg-brand-primary p-3 rounded-lg grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {technicians.map(tech => (
                        <div key={tech.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`vis-${tech.id}`}
                                checked={visibleTo.includes(tech.id)}
                                onChange={() => handleVisibilityChange(tech.id)}
                                className="h-5 w-5 rounded bg-brand-secondary border-brand-accent text-brand-blue focus:ring-brand-blue"
                            />
                            <label htmlFor={`vis-${tech.id}`} className="flex items-center gap-2 text-brand-light select-none cursor-pointer">
                                <img src={tech.avatar} alt={tech.name} className="w-6 h-6 rounded-full" />
                                <span>{tech.name}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full mt-4 bg-brand-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                Crear Misión
            </button>
        </form>
    );
};

export default MissionCreator;