import React, { useEffect, useMemo, useState } from 'react';
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
  const [personSearch, setPersonSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

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

  const availableCompanies = useMemo(() => {
    const companies = isOperationsManager(currentUser) && currentUser?.company
      ? [currentUser.company]
      : Object.values(Company);

    return companies.filter(company => assignableUsers.some(user => user.company === company));
  }, [assignableUsers, currentUser]);

  const availableRoles = useMemo(() => {
    const roles = isOperationsManager(currentUser) ? OPERATIONS_MANAGED_ROLES : Object.values(Role);
    return roles.filter(role => role !== Role.ADMIN && assignableUsers.some(user => user.role === role));
  }, [assignableUsers, currentUser]);

  const normalizedPersonSearch = personSearch.trim().toLowerCase();
  const normalizedCompanySearch = companySearch.trim().toLowerCase();
  const normalizedRoleSearch = roleSearch.trim().toLowerCase();

  const filteredPeople = useMemo(() => {
    return assignableUsers
      .filter(user => !visibleTo.includes(user.id))
      .filter(user => {
        if (!normalizedPersonSearch) return true;
        return `${user.name} ${user.role} ${user.company || ''}`.toLowerCase().includes(normalizedPersonSearch);
      })
      .slice(0, 8);
  }, [assignableUsers, normalizedPersonSearch, visibleTo]);

  const filteredCompanies = useMemo(() => {
    return availableCompanies
      .filter(company => !selectedCompanies.includes(company))
      .filter(company => !normalizedCompanySearch || company.toLowerCase().includes(normalizedCompanySearch));
  }, [availableCompanies, normalizedCompanySearch, selectedCompanies]);

  const filteredRoles = useMemo(() => {
    return availableRoles
      .filter(role => !selectedRoles.includes(role))
      .filter(role => !normalizedRoleSearch || role.toLowerCase().includes(normalizedRoleSearch));
  }, [availableRoles, normalizedRoleSearch, selectedRoles]);

  const visibleUsers = useMemo(() => {
    const visibleIds = new Set(visibleTo);

    assignableUsers.forEach(user => {
      const companyMatch = user.company ? selectedCompanies.includes(user.company) : false;
      const roleMatch = selectedRoles.includes(user.role);
      if (companyMatch || roleMatch) visibleIds.add(user.id);
    });

    return assignableUsers.filter(user => visibleIds.has(user.id));
  }, [assignableUsers, selectedCompanies, selectedRoles, visibleTo]);

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

  const addVisiblePerson = (userId: string) => {
    setVisibleTo(prev => prev.includes(userId) ? prev : [...prev, userId]);
    setPersonSearch('');
  };

  const removeVisiblePerson = (userId: string) => {
    setVisibleTo(prev => prev.filter(id => id !== userId));
  };

  const addVisibleCompany = (company: Company) => {
    setSelectedCompanies(prev => prev.includes(company) ? prev : [...prev, company]);
    setCompanySearch('');
  };

  const addVisibleRole = (role: Role) => {
    setSelectedRoles(prev => prev.includes(role) ? prev : [...prev, role]);
    setRoleSearch('');
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
    const computedVisibleTo = visibleUsers.map(user => user.id);
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
        visibleTo: computedVisibleTo,
        company: targetCompany || undefined
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
      setSelectedCompanies([]);
      setSelectedRoles([]);
      setPersonSearch('');
      setCompanySearch('');
      setRoleSearch('');
      setTargetCompany(isOperationsManager(currentUser) && currentUser?.company ? currentUser.company : '');
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

      <div className="col-span-full space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <label className="block font-semibold">Visible para</label>
            <p className="text-xs text-brand-light">Busca personas puntuales o agrega grupos por empresa y puesto.</p>
          </div>
          <div className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-3 py-1.5 rounded-full self-start sm:self-auto">
            {visibleUsers.length} persona{visibleUsers.length === 1 ? '' : 's'} seleccionada{visibleUsers.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-brand-primary border border-brand-accent rounded-xl p-3">
            <label className="block text-xs font-black uppercase tracking-widest text-brand-light mb-2">Personas</label>
            <input
              type="search"
              value={personSearch}
              onChange={e => setPersonSearch(e.target.value)}
              placeholder="Buscar por nombre, empresa o puesto..."
              className="w-full bg-brand-secondary p-2.5 rounded-lg border border-brand-accent text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            <div className="mt-2 max-h-44 overflow-y-auto space-y-1 pr-1">
              {filteredPeople.length > 0 ? filteredPeople.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => addVisiblePerson(user.id)}
                  className="w-full flex items-center gap-2 text-left p-2 rounded-lg hover:bg-brand-secondary transition-colors"
                >
                  <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brand-highlight truncate">{user.name}</span>
                    <span className="block text-[11px] text-brand-light truncate">{user.company || 'Sin empresa'} · {user.role}</span>
                  </span>
                </button>
              )) : (
                <p className="text-xs text-brand-light p-2">Sin resultados.</p>
              )}
            </div>
          </div>

          <div className="bg-brand-primary border border-brand-accent rounded-xl p-3">
            <label className="block text-xs font-black uppercase tracking-widest text-brand-light mb-2">Empresas</label>
            <input
              type="search"
              value={companySearch}
              onChange={e => setCompanySearch(e.target.value)}
              placeholder="Buscar empresa..."
              className="w-full bg-brand-secondary p-2.5 rounded-lg border border-brand-accent text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            <div className="mt-2 max-h-44 overflow-y-auto space-y-1 pr-1">
              {filteredCompanies.length > 0 ? filteredCompanies.map(company => (
                <button
                  key={company}
                  type="button"
                  onClick={() => addVisibleCompany(company)}
                  className="w-full flex items-center justify-between gap-2 text-left p-2 rounded-lg hover:bg-brand-secondary transition-colors"
                >
                  <span className="text-sm font-bold text-brand-highlight">{company}</span>
                  <span className="text-[11px] font-bold text-brand-light">
                    {assignableUsers.filter(user => user.company === company).length}
                  </span>
                </button>
              )) : (
                <p className="text-xs text-brand-light p-2">Sin resultados.</p>
              )}
            </div>
          </div>

          <div className="bg-brand-primary border border-brand-accent rounded-xl p-3">
            <label className="block text-xs font-black uppercase tracking-widest text-brand-light mb-2">Puestos</label>
            <input
              type="search"
              value={roleSearch}
              onChange={e => setRoleSearch(e.target.value)}
              placeholder="Buscar puesto..."
              className="w-full bg-brand-secondary p-2.5 rounded-lg border border-brand-accent text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            <div className="mt-2 max-h-44 overflow-y-auto space-y-1 pr-1">
              {filteredRoles.length > 0 ? filteredRoles.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => addVisibleRole(role)}
                  className="w-full flex items-center justify-between gap-2 text-left p-2 rounded-lg hover:bg-brand-secondary transition-colors"
                >
                  <span className="text-sm font-bold text-brand-highlight capitalize">{role}</span>
                  <span className="text-[11px] font-bold text-brand-light">
                    {assignableUsers.filter(user => user.role === role).length}
                  </span>
                </button>
              )) : (
                <p className="text-xs text-brand-light p-2">Sin resultados.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-brand-primary border border-brand-accent rounded-xl p-3 min-h-16">
          <div className="flex flex-wrap gap-2">
            {visibleTo.map(id => assignableUsers.find(user => user.id === id)).filter(Boolean).map(user => user && (
              <button
                key={user.id}
                type="button"
                onClick={() => removeVisiblePerson(user.id)}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-brand-blue text-white text-xs font-bold"
                title="Quitar persona"
              >
                <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                {user.name}
                <span className="text-white/80">&times;</span>
              </button>
            ))}
            {selectedCompanies.map(company => (
              <button
                key={company}
                type="button"
                onClick={() => setSelectedCompanies(prev => prev.filter(item => item !== company))}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/15 text-brand-orange text-xs font-black"
                title="Quitar empresa"
              >
                Empresa: {company}
                <span>&times;</span>
              </button>
            ))}
            {selectedRoles.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRoles(prev => prev.filter(item => item !== role))}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-green/15 text-brand-green text-xs font-black capitalize"
                title="Quitar puesto"
              >
                Puesto: {role}
                <span>&times;</span>
              </button>
            ))}
            {visibleUsers.length === 0 && (
              <p className="text-xs text-brand-light">Sin restricciones puntuales. Si no seleccionas nada, queda visible para todos los perfiles permitidos.</p>
            )}
          </div>
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
