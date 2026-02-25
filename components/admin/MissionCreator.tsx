import React, { useState } from 'react';
import { User, Role, MissionDifficulty } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { generateMissionDetails } from '../../services/geminiService';
import { AiIcon } from '../Icons';

const MissionCreator: React.FC<{ users: User[] }> = ({ users }) => {
    const { addMission } = useData();
    const { showToast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<MissionDifficulty>(MissionDifficulty.MEDIUM);
    const [xp, setXp] = useState(50);
    const [bonusMonetario, setBonusMonetario] = useState(0);
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [deadline, setDeadline] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [visibleTo, setVisibleTo] = useState<string[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);


    const assignableUsers = users.filter(u => u.role !== Role.ADMIN);

    const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        if (selectedId && !assignedTo.includes(selectedId)) {
            setAssignedTo([...assignedTo, selectedId]);
            if (!visibleTo.includes(selectedId)) {
                setVisibleTo(prev => [...prev, selectedId]);
            }
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

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) {
            showToast('Por favor, ingresa una descripción para la IA.', 'info');
            return;
        }
        setIsAiLoading(true);
        try {
            const result = await generateMissionDetails(aiPrompt);
            setTitle(result.title || '');
            setDescription(result.description || '');
            setDifficulty(result.difficulty || MissionDifficulty.MEDIUM);
            setXp(result.xp || 50);
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            setDeadline(result.deadline || '');
            showToast('¡Misión generada por IA! Revisa y ajusta los detalles.', 'success');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error desconocido de la IA.', 'error');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !startDate || !deadline) {
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
                title,
                description,
                difficulty,
                xp,
                bonusMonetario: bonusMonetario > 0 ? bonusMonetario : undefined,
                assignedTo: assignedTo.length > 0 ? assignedTo : null,
                startDate,
                deadline,
                skills: [], // Skills might be added later or derived differently
                visibleTo,
            });
            showToast('¡Misión creada con éxito!', 'success');
            // Reset form
            setTitle('');
            setDescription('');
            setDifficulty(MissionDifficulty.MEDIUM);
            setXp(50);
            setBonusMonetario(0);
            setAssignedTo([]);
            setStartDate(new Date().toISOString().split('T')[0]);
            setDeadline('');
            setVisibleTo([]);
            setAiPrompt('');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al crear la misión.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const assignedUsers = assignedTo.map(id => assignableUsers.find(u => u.id === id)).filter(Boolean);

    return (
        <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-lg shadow-xl space-y-6">
            <h3 className="text-2xl font-bold text-center">Crear Nueva Misión</h3>

            {/* AI Generation Section */}
            <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent">
                <h4 className="font-bold text-lg mb-2 text-brand-orange">Creación Rápida con IA</h4>
                <p className="text-sm text-brand-light mb-3">Describe la misión en lenguaje natural y la IA llenará los campos por ti. Ej: "Cambiar aceite y filtros de un VW Amarok 2021, plazo 2 días"</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe la misión aquí..."
                        className="flex-grow bg-brand-secondary p-2 rounded border border-brand-accent"
                    />
                    <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={isAiLoading}
                        className="bg-brand-orange text-brand-primary font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-opacity-50"
                    >
                        {isAiLoading
                            ? <div className="w-5 h-5 border-2 border-t-transparent border-brand-primary rounded-full animate-spin"></div>
                            : <AiIcon className="w-5 h-5" />
                        }
                        <span>Generar con IA</span>
                    </button>
                </div>
            </div>

            {error && <p className="bg-brand-red/20 text-brand-red p-2 rounded-md text-sm">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Título de la Misión" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                <div>
                    <select onChange={handleAssigneeChange} value="" className="w-full bg-brand-primary p-3 rounded border border-brand-accent mb-2 text-sm">
                        <option value="">Asignar personal...</option>
                        {assignableUsers.filter(u => !assignedTo.includes(u.id)).map(u => (
                            <option key={u.id} value={u.id}>[{u.role.toUpperCase()}] {u.name}</option>
                        ))}
                    </select>
                    <div className="flex flex-wrap gap-2">
                        {assignedTo.map(id => assignableUsers.find(u => u.id === id)).filter(Boolean).map(user => user && (
                            <div key={user.id} className="bg-brand-blue/50 text-white flex items-center gap-2 px-2 py-1 rounded-full text-sm">
                                <img src={user.avatar} className="w-5 h-5 rounded-full" />
                                <span>{user.name}</span>
                                <button type="button" onClick={() => removeAssignee(user.id)} className="text-red-300 hover:text-white">&times;</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <textarea placeholder="Descripción detallada de la misión..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent h-28" required />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div><label className="block text-sm font-medium text-brand-light mb-1">Fecha de Inicio</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                <div><label className="block text-sm font-medium text-brand-light mb-1">Fecha Límite</label><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                <div><label className="block text-sm font-medium text-brand-light mb-1">Dificultad</label><select value={difficulty} onChange={e => setDifficulty(e.target.value as MissionDifficulty)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent"><option value={MissionDifficulty.LOW}>Bajo</option><option value={MissionDifficulty.MEDIUM}>Medio</option><option value={MissionDifficulty.HIGH}>Alto</option></select></div>
                <div><label className="block text-sm font-medium text-brand-light mb-1">XP</label><input type="number" value={xp} onChange={e => setXp(parseInt(e.target.value, 10) || 0)} min="0" className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required /></div>
                <div><label className="block text-sm font-medium text-brand-light mb-1">Bono ($)</label><input type="number" value={bonusMonetario} onChange={e => setBonusMonetario(parseInt(e.target.value, 10) || 0)} min="0" className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" /></div>
            </div>

            <div className="col-span-full">
                <label className="block font-semibold mb-2">Visible para</label>
                <div className="bg-brand-primary p-3 rounded-lg grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-40 overflow-y-auto">
                    {assignableUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`vis-${user.id}`}
                                checked={visibleTo.includes(user.id)}
                                onChange={() => handleVisibilityChange(user.id)}
                                className="h-5 w-5 rounded bg-brand-secondary border-brand-accent text-brand-blue focus:ring-brand-blue"
                            />
                            <label htmlFor={`vis-${user.id}`} className="flex items-center gap-2 text-brand-light select-none cursor-pointer">
                                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                                <span className="text-xs">{user.name}</span>
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