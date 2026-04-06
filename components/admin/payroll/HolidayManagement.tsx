import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { TrashIcon, PlusIcon, CalendarIcon } from '../../Icons';

const HolidayManagement: React.FC = () => {
  const { holidays, addHoliday, deleteHoliday } = useData();
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newDesc) return;
    setIsAdding(true);
    try {
      await addHoliday(newDate, newDesc);
      setNewDate('');
      setNewDesc('');
    } finally {
      setIsAdding(false);
    }
  };

  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="bg-brand-primary p-6 rounded-2xl border border-white/5 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-black text-brand-highlight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-brand-blue" />
            Gestión de Feriados
          </h3>
          <p className="text-xs text-brand-light opacity-70">Los feriados evitan descuentos por inasistencia en la nómina.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-black text-brand-light px-1">Fecha</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full bg-brand-secondary border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-blue outline-none transition-all"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-black text-brand-light px-1">Descripción</label>
          <input
            type="text"
            placeholder="Ej: Año Nuevo"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-brand-secondary border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-brand-blue outline-none transition-all"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isAdding}
            className="w-full bg-brand-blue text-white font-black uppercase text-xs py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4" />
            {isAdding ? 'Agregando...' : 'Agregar Feriado'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-4 text-[10px] uppercase font-black text-brand-light">Fecha</th>
              <th className="px-6 py-4 text-[10px] uppercase font-black text-brand-light">Descripción</th>
              <th className="px-6 py-4 text-[10px] uppercase font-black text-brand-light text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedHolidays.map((holiday) => (
              <tr key={holiday.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-sm font-black text-white bg-brand-blue/10 px-2 py-1 rounded">
                    {new Date(holiday.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-300">{holiday.description}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                        if (window.confirm('¿Eliminar este feriado?')) {
                            deleteHoliday(holiday.id);
                        }
                    }}
                    className="p-2 text-slate-500 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-all"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-sm text-brand-light italic opacity-50">
                  No hay feriados registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HolidayManagement;
