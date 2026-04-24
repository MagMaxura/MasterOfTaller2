import React, { useMemo, useState } from 'react';
import { Role, User } from '../../types';
import { useData } from '../../contexts/DataContext';

const PersonChip: React.FC<{
  user: User;
  draggable?: boolean;
  onDragStart?: (userId: string) => void;
}> = ({ user, draggable = false, onDragStart }) => (
  <div
    draggable={draggable}
    onDragStart={(e) => {
      if (!draggable) return;
      e.dataTransfer.setData('text/plain', user.id);
      onDragStart?.(user.id);
    }}
    className={`flex items-center gap-3 p-2.5 rounded-xl border border-brand-accent bg-white ${
      draggable ? 'cursor-grab active:cursor-grabbing' : ''
    }`}
  >
    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-lg object-cover" />
    <div className="min-w-0">
      <p className="text-sm font-bold text-brand-highlight truncate">{user.name}</p>
      <p className="text-[10px] uppercase font-black tracking-widest text-brand-light truncate">
        {user.role} {user.company ? `• ${user.company}` : ''}
      </p>
    </div>
  </div>
);

const OrgChartManagement: React.FC = () => {
  const { users, authorityRelations, upsertAuthorityRelation, removeAuthorityRelation } = useData();
  const [search, setSearch] = useState('');
  const [draggingUserId, setDraggingUserId] = useState<string | null>(null);

  const activeUsers = useMemo(() => users.filter(u => u.is_active), [users]);

  const managedBy = useMemo(() => {
    const map = new Map<string, string>();
    authorityRelations
      .filter(r => r.active)
      .forEach(r => map.set(r.subordinate_id, r.manager_id));
    return map;
  }, [authorityRelations]);

  const byId = useMemo(() => {
    const map = new Map<string, User>();
    activeUsers.forEach(u => map.set(u.id, u));
    return map;
  }, [activeUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeUsers;
    return activeUsers.filter(u =>
      `${u.name} ${u.role} ${u.company ?? ''}`.toLowerCase().includes(q)
    );
  }, [activeUsers, search]);

  const managerCandidates = useMemo(
    () => filteredUsers.filter(u => u.role === Role.ADMIN || u.role === Role.OPERATIONS),
    [filteredUsers]
  );

  const subordinates = useMemo(
    () => filteredUsers.filter(u => u.role !== Role.ADMIN),
    [filteredUsers]
  );

  const childrenByManager = useMemo(() => {
    const map = new Map<string, User[]>();
    managerCandidates.forEach(m => map.set(m.id, []));
    subordinates.forEach(s => {
      const managerId = managedBy.get(s.id);
      if (managerId && map.has(managerId)) {
        map.get(managerId)!.push(s);
      }
    });
    return map;
  }, [managerCandidates, subordinates, managedBy]);

  const unassigned = useMemo(
    () => subordinates.filter(s => !managedBy.get(s.id) || !byId.has(managedBy.get(s.id)!)),
    [subordinates, managedBy, byId]
  );

  const handleAssign = async (managerId: string, subordinateId: string) => {
    if (managerId === subordinateId) return;
    await upsertAuthorityRelation(managerId, subordinateId);
  };

  const handleDropOnManager = async (e: React.DragEvent, managerId: string) => {
    e.preventDefault();
    const subordinateId = e.dataTransfer.getData('text/plain');
    if (!subordinateId) return;
    await handleAssign(managerId, subordinateId);
    setDraggingUserId(null);
  };

  const handleDropUnassign = async (e: React.DragEvent) => {
    e.preventDefault();
    const subordinateId = e.dataTransfer.getData('text/plain');
    if (!subordinateId) return;
    await removeAuthorityRelation(subordinateId);
    setDraggingUserId(null);
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-brand-highlight tracking-tight">Organigrama</h2>
        <p className="text-sm text-brand-light">
          Arrastra personas hacia un responsable para definir autoridad. Se permiten relaciones entre empresas.
        </p>
      </div>

      <div className="bg-brand-secondary border border-brand-accent rounded-2xl p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar persona por nombre, rol o empresa..."
          className="w-full bg-white border border-brand-accent rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-white border border-brand-accent rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-light">Sin Responsable</h3>
            <span className="text-xs font-black text-brand-blue">{unassigned.length}</span>
          </div>

          <div
            onDragOver={allowDrop}
            onDrop={handleDropUnassign}
            className={`min-h-[180px] rounded-xl border-2 border-dashed p-3 space-y-2 transition-colors ${
              draggingUserId ? 'border-brand-blue bg-brand-blue/5' : 'border-brand-accent'
            }`}
          >
            {unassigned.length === 0 ? (
              <p className="text-xs text-brand-light italic">Todos tienen responsable asignado.</p>
            ) : (
              unassigned.map(u => (
                <PersonChip key={u.id} user={u} draggable onDragStart={setDraggingUserId} />
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {managerCandidates.map(manager => {
            const team = childrenByManager.get(manager.id) || [];
            return (
              <div
                key={manager.id}
                onDragOver={allowDrop}
                onDrop={(e) => handleDropOnManager(e, manager.id)}
                className={`bg-white border rounded-2xl p-4 transition-colors ${
                  draggingUserId ? 'border-brand-blue/40' : 'border-brand-accent'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={manager.avatar} alt={manager.name} className="w-9 h-9 rounded-xl object-cover" />
                    <div>
                      <p className="font-black text-brand-highlight">{manager.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue">
                        {manager.role} {manager.company ? `• ${manager.company}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-brand-light">{team.length} a cargo</span>
                </div>

                <div className="space-y-2 min-h-[90px]">
                  {team.length === 0 ? (
                    <p className="text-xs text-brand-light italic">Suelta aquí personal a cargo.</p>
                  ) : (
                    team.map(member => (
                      <div key={member.id} className="relative">
                        <PersonChip user={member} draggable onDragStart={setDraggingUserId} />
                        <button
                          type="button"
                          onClick={() => removeAuthorityRelation(member.id)}
                          className="absolute top-2 right-2 text-[10px] font-black uppercase text-brand-red"
                        >
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrgChartManagement;

