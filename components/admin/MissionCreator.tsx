import React, { useEffect, useState } from 'react';
import { User, Role, MissionDifficulty, Company } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { canManageUserFromPanel, isOperationsManager, OPERATIONS_MANAGED_ROLES } from '../../utils/operationsPermissions';

interface MissionCreatorProps {
  users: User[];
  onCreated?: () => void;
  onCancel?: () => void;
  initialStartDate?: string;
  className?: string;
}

const MissionCreator: React.FC<MissionCreatorProps> = ({ users, onCreated, onCancel, initialStartDate, className }) => {
  const { currentUser, addMission } = useData();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<MissionDifficulty>(MissionDifficulty.MEDIUM);
  const [xp, setXp] = useState(50);
  const [bonusMonetario, setBonusMonetario] = useState(0);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState(initialStartDate || new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [visibleTo, setVisibleTo] = useState<string[]>([]);
  const [targetCompany, setTargetCompany] = useState<Company | ''>('');
  const [targetRole, setTargetRole] = useState<Role | ''>('');

  useEffect(() => {
    if (isOperationsManager(currentUser) && currentUser.company) {
      setTargetCompany(currentUser.company);
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
  }, [initialStartDate]);

  const assignableUsers = users.filter(u => {
    if (!currentUser) return false;
    if (currentUser.role === Role.ADMIN) return u.role !== Role.ADMIN;
    return canManageUserFromPanel(currentUser, u);
  });

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

  const handleVisibilityChange = (userId: string) => {
    setVisibleTo(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !startDate || !deadline) {
      setError('Todos los campos son obligatorios, excepto el personal asignado.');
      return;
    }
    if (new Date(deadline) < new Date(startDate)) {
      setError('La fecha limite no puede ser anterior a la fecha de inicio.');
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
        skills: [],
        visibleTo,
        company: targetCompany || undefined,
        role: targetRole || undefined
      });

      showToast('Mision creada con exito.', 'success');

      setTitle('');
      setDescription('');
      setDifficulty(MissionDifficulty.MEDIUM);
      setXp(50);
      setBonusMonetario(0);
      setAssignedTo([]);
      setStartDate(initialStartDate || new Date().toISOString().split('T')[0]);
      setDeadline('');
      setVisibleTo([]);
      setTargetCompany('');
      setTargetRole('');
      onCreated?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear la mision.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className || 'bg-brand-secondary p-6 rounded-xl shadow-xl space-y-6'}>
      <h3 className="text-2xl font-bold text-center">Crear Nueva Mision</h3>

      {error && <p className="bg-brand-red/20 text-brand-red p-2 rounded-md text-sm">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input
          type="text"
          placeholder="Titulo de la mision"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-brand-primary p-3 rounded border border-brand-accent"
          required
        />
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

      <textarea
        placeholder="Descripcion detallada de la mision..."
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full bg-brand-primary p-3 rounded border border-brand-accent min-h-[220px] resize-y"
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-light mb-1">Fecha de Inicio</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-light mb-1">Fecha Limite</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-light mb-1">Dificultad</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as MissionDifficulty)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent">
            <option value={MissionDifficulty.LOW}>Bajo</option>
            <option value={MissionDifficulty.MEDIUM}>Medio</option>
            <option value={MissionDifficulty.HIGH}>Alto</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-light mb-1">XP</label>
          <input type="number" value={xp} onChange={e => setXp(parseInt(e.target.value, 10) || 0)} min="0" className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" required />
        </div>
        {currentUser?.role === Role.ADMIN && (
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">Bono ($)</label>
            <input type="number" value={bonusMonetario} onChange={e => setBonusMonetario(parseInt(e.target.value, 10) || 0)} min="0" className="w-full bg-brand-primary p-2.5 rounded border border-brand-accent" />
          </div>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-4 border-t border-brand-accent/50">
        <div>
          <label className="block text-sm font-bold text-brand-orange mb-1 uppercase tracking-wider">Restringir a Empresa</label>
          <select
            value={targetCompany}
            onChange={e => setTargetCompany(e.target.value as Company)}
            disabled={isOperationsManager(currentUser) && !!currentUser?.company}
            className="w-full bg-brand-primary p-3 rounded border border-brand-accent text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
          >
            <option value="">-- TODAS (Publico) --</option>
            {Object.values(Company).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-brand-orange mb-1 uppercase tracking-wider">Restringir a Area / Rol</label>
          <select
            value={targetRole}
            onChange={e => setTargetRole(e.target.value as Role)}
            className="w-full bg-brand-primary p-3 rounded border border-brand-accent text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all"
          >
            <option value="">-- TODAS (Publico) --</option>
            {(isOperationsManager(currentUser) ? OPERATIONS_MANAGED_ROLES : Object.values(Role)).map(r => (
              <option key={r} value={r}>{r.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-brand-accent text-brand-highlight font-bold py-3 px-4 rounded-lg"
          >
            Cancelar
          </button>
        )}
        <button type="submit" disabled={isLoading} className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
          {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
          Crear Mision
        </button>
      </div>
    </form>
  );
};

export default MissionCreator;
