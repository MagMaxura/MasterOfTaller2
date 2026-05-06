import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { Company, RecurringIncome } from '../../../types';
import { PlusIcon, EditIcon, TrashIcon, CurrencyDollarIcon } from '../../Icons';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

const RecurringIncomesManagement: React.FC = () => {
    const { recurringIncomes, addRecurringIncome, updateRecurringIncome, deleteRecurringIncome } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<RecurringIncome | null>(null);

    const [formData, setFormData] = useState({
        invoice_name: '',
        company: Company.POTABILIZAR,
        amount: 0,
        period: 'mensual'
    });

    const handleOpenModal = (income?: RecurringIncome) => {
        if (income) {
            setEditingIncome(income);
            setFormData({
                invoice_name: income.invoice_name,
                company: income.company,
                amount: income.amount,
                period: income.period
            });
        } else {
            setEditingIncome(null);
            setFormData({
                invoice_name: '',
                company: Company.POTABILIZAR,
                amount: 0,
                period: 'mensual'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingIncome) {
                await updateRecurringIncome(editingIncome.id, formData);
            } else {
                await addRecurringIncome(formData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving recurring income:", error);
        }
    };

    const totalIncome = recurringIncomes.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-brand-highlight tracking-tight">Ingresos Recurrentes</h3>
                    <p className="text-sm text-brand-light">Gestión de proyecciones mensuales por empresa.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-brand-blue text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <PlusIcon className="w-4 h-4" /> Nuevo Ingreso
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-brand-accent shadow-premium">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green">
                            <CurrencyDollarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-brand-light uppercase tracking-widest">Total Mensual Proyectado</p>
                            <h4 className="text-2xl font-black text-brand-highlight">{formatCurrency(totalIncome)}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[32px] overflow-hidden border border-brand-accent shadow-premium">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-secondary/50 border-b border-brand-accent text-[10px] text-brand-light uppercase font-black tracking-[0.2em]">
                                <th className="p-6">Ingreso / Factura</th>
                                <th className="p-6">Empresa</th>
                                <th className="p-6">Valor</th>
                                <th className="p-6">Periodo</th>
                                <th className="p-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-accent">
                            {recurringIncomes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-brand-light italic">No hay ingresos recurrentes registrados.</td>
                                </tr>
                            ) : (
                                recurringIncomes.map((income) => (
                                    <tr key={income.id} className="hover:bg-brand-secondary/30 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-black text-brand-highlight">{income.invoice_name}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                                                {income.company}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-black text-brand-green">{formatCurrency(income.amount)}</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-sm font-bold text-brand-light capitalize">{income.period}</div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(income)}
                                                    className="p-2 rounded-xl text-brand-blue bg-brand-blue/10 hover:bg-brand-blue hover:text-white transition-all"
                                                    title="Editar"
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteRecurringIncome(income.id)}
                                                    className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all"
                                                    title="Eliminar"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-brand-highlight/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-brand-accent animate-in fade-in zoom-in duration-300">
                        <div className="bg-brand-secondary px-8 py-6 border-b border-brand-accent">
                            <h4 className="text-xl font-black text-brand-highlight tracking-tight">
                                {editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso Recurrente'}
                            </h4>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Concepto / Factura</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                    placeholder="Ej: Mantenimiento CEMAR"
                                    value={formData.invoice_name}
                                    onChange={(e) => setFormData({ ...formData, invoice_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Empresa</label>
                                <select
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value as Company })}
                                >
                                    {Object.values(Company).map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Valor</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-brand-light">$</span>
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-brand-secondary border border-brand-accent rounded-2xl pl-8 pr-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Periodo</label>
                                    <select
                                        className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                        value={formData.period}
                                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                    >
                                        <option value="mensual">Mensual</option>
                                        <option value="quincenal">Quincenal</option>
                                        <option value="bimestral">Bimestral</option>
                                        <option value="trimestral">Trimestral</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border border-brand-accent text-brand-light hover:bg-brand-secondary transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-brand-blue text-white shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {editingIncome ? 'Guardar Cambios' : 'Crear Ingreso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecurringIncomesManagement;
