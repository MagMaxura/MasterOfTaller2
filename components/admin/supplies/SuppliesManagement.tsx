import React, { useState, useMemo } from 'react';
import { Supply } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { PlusIcon, EditIcon } from '../../Icons';
import SupplyFormModal from './SupplyFormModal';

const SuppliesManagement: React.FC = () => {
    const { supplies, missionSupplies, updateSupply, deleteSupply } = useData();
    const { showToast } = useToast();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const assignedQuantities = useMemo(() => {
        const counts = new Map<string, number>();
        missionSupplies.forEach(ms => {
            counts.set(ms.supply_id, (counts.get(ms.supply_id) || 0) + ms.quantity_assigned);
        });
        return counts;
    }, [missionSupplies]);

    const filteredSupplies = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return supplies;
        return supplies.filter(supply =>
            supply.general_category.toLowerCase().includes(lowercasedFilter) ||
            supply.specific_category.toLowerCase().includes(lowercasedFilter) ||
            supply.type.toLowerCase().includes(lowercasedFilter) ||
            supply.model.toLowerCase().includes(lowercasedFilter) ||
            (supply.details && supply.details.toLowerCase().includes(lowercasedFilter))
        );
    }, [supplies, searchTerm]);

    const handleEdit = (supply: Supply) => {
        setEditingSupply(supply);
        setIsFormModalOpen(true);
    };

    const handleCreate = () => {
        setEditingSupply(null);
        setIsFormModalOpen(true);
    };

    const handleDelete = async (supply: Supply) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar "${supply.type} ${supply.model}"?`)) {
            setIsLoading(prev => ({ ...prev, [supply.id]: true }));
            try {
                await deleteSupply(supply);
                showToast('Insumo eliminado.', 'success');
            } catch (error) {
                showToast(error instanceof Error ? error.message : "Error al eliminar.", 'error');
            } finally {
                setIsLoading(prev => ({ ...prev, [supply.id]: false }));
            }
        }
    };

    const handleUpdateStock = async (supply: Supply, newStock: number) => {
        const assigned = assignedQuantities.get(supply.id) || 0;
        if (newStock < assigned) {
            showToast(`No se puede reducir stock por debajo de lo asignado (${assigned}).`, 'error');
            return;
        }
        setIsLoading(prev => ({ ...prev, [supply.id]: true }));
        try {
            await updateSupply(supply.id, { stock_quantity: newStock }, null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error al actualizar stock.", 'error');
        } finally {
            setIsLoading(prev => ({ ...prev, [supply.id]: false }));
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
                <div>
                    <h2 className="text-4xl font-black text-brand-highlight tracking-tight">Planilla de Insumos</h2>
                    <p className="text-sm text-brand-light font-bold uppercase tracking-widest mt-1">Repuestos, herramientas y materiales de obra</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="w-full sm:w-auto bg-brand-highlight text-white font-black py-4 px-8 rounded-3xl flex items-center justify-center gap-3 hover:bg-brand-blue transition-all shadow-lg active:scale-95"
                >
                    <PlusIcon className="w-6 h-6" />
                    <span className="text-xs uppercase tracking-[0.2em]">Cargar Insumo</span>
                </button>
            </div>

            <div className="group relative">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-brand-light/50">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                    type="search"
                    placeholder="Filtrar por modelo, código, categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white pl-14 pr-8 py-5 rounded-3xl border-2 border-brand-accent/50 focus:border-brand-blue focus:ring-0 transition-all font-bold text-brand-highlight placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em] shadow-soft focus:shadow-premium"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredSupplies.length === 0 ? (
                    <div className="col-span-full border-4 border-dashed border-brand-accent/50 rounded-[40px] p-20 text-center bg-white/50">
                        <p className="text-sm font-black uppercase text-brand-light tracking-widest opacity-30">
                            {supplies.length > 0 ? 'Sin resultados para la búsqueda' : 'Sin insumos cargados'}
                        </p>
                    </div>
                ) : (
                    filteredSupplies.map(supply => {
                        const assigned = assignedQuantities.get(supply.id) || 0;
                        const available = supply.stock_quantity - assigned;

                        let badgeStyle = 'bg-brand-highlight/5 text-brand-highlight ring-brand-highlight/20';
                        if (available <= 0) badgeStyle = 'bg-brand-red/5 text-brand-red ring-brand-red/20';
                        else if (available <= 2) badgeStyle = 'bg-brand-orange/5 text-brand-orange ring-brand-orange/20';

                        return (
                            <div key={supply.id} className="bg-white p-6 rounded-[32px] shadow-soft hover:shadow-premium transition-all border border-brand-accent/50 group active:scale-[0.98] flex flex-col">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-20 h-20 bg-brand-secondary rounded-2xl flex items-center justify-center p-2 shadow-inner group-hover:bg-brand-blue/5 transition-colors shrink-0">
                                        <img src={supply.photo_url || 'https://placehold.co/128x128/f4f4f5/71717a?text=?'} alt={supply.model} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-lg text-brand-highlight leading-tight group-hover:text-brand-blue transition-colors line-clamp-1">{supply.type}</h4>
                                        <p className="text-[10px] font-black uppercase text-brand-blue tracking-widest mt-0.5">{supply.model}</p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            <span className="text-[8px] font-black bg-brand-secondary px-2 py-0.5 rounded-full uppercase tracking-tighter opacity-60">{supply.general_category}</span>
                                            <span className="text-[8px] font-black bg-brand-secondary px-2 py-0.5 rounded-full uppercase tracking-tighter opacity-60">{supply.specific_category}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 mb-6">
                                    <p className="text-xs text-brand-light leading-relaxed line-clamp-2 opacity-80 italic">
                                        {supply.details || 'Sin especificaciones técnicas registradas...'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-brand-secondary/30 rounded-2xl mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-light opacity-60">Control Disponibilidad</span>
                                        <div className={`mt-1 px-3 py-1 rounded-lg ring-1 ${badgeStyle} inline-flex items-center gap-2`}>
                                            <span className="font-black text-sm">{available}</span>
                                            <span className="text-[8px] font-black uppercase tracking-tighter">unidades</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-light opacity-60">Stock Físico</span>
                                        <div className="mt-1 flex items-center gap-2 justify-end">
                                            <input
                                                type="number"
                                                value={supply.stock_quantity}
                                                onChange={(e) => handleUpdateStock(supply, parseInt(e.target.value, 10) || 0)}
                                                className="w-16 h-8 bg-white rounded-lg border-2 border-brand-accent/50 text-center font-black text-xs focus:border-brand-blue focus:ring-0 transition-all"
                                                disabled={isLoading[supply.id]}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(supply)}
                                        className="flex-1 h-12 bg-white border-2 border-brand-highlight text-brand-highlight rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-brand-highlight hover:text-white transition-all shadow-sm active:scale-95"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                        <span>Editar Ficha</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supply)}
                                        disabled={isLoading[supply.id]}
                                        className="w-12 h-12 bg-brand-red/10 text-brand-red rounded-2xl flex items-center justify-center hover:bg-brand-red hover:text-white transition-all disabled:opacity-20 active:scale-95"
                                    >
                                        {isLoading[supply.id] ? <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>}
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
            {isFormModalOpen && <SupplyFormModal supply={editingSupply} onClose={() => setIsFormModalOpen(false)} />}
        </div>
    );
};

export default SuppliesManagement;