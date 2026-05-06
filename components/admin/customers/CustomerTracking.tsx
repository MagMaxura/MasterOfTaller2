import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { CustomerProject, Company } from '../../../types';
import { PlusIcon, EditIcon, TrashIcon, UserIcon, PhoneIcon, TasksIcon } from '../../Icons';

const CustomerTracking: React.FC = () => {
    const { customerProjects, addCustomerProject, updateCustomerProject, deleteCustomerProject } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<CustomerProject | null>(null);

    const [formData, setFormData] = useState({
        customer_name: '',
        project_name: '',
        company: '',
        phone: '',
        job_type: '',
        requirements: '',
        status: 'PENDIENTE'
    });

    const handleOpenModal = (project?: CustomerProject) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                customer_name: project.customer_name,
                project_name: project.project_name,
                company: project.company,
                phone: project.phone,
                job_type: project.job_type,
                requirements: project.requirements,
                status: project.status
            });
        } else {
            setEditingProject(null);
            setFormData({
                customer_name: '',
                project_name: '',
                company: Company.POTABILIZAR,
                phone: '',
                job_type: '',
                requirements: '',
                status: 'PENDIENTE'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProject) {
                await updateCustomerProject(editingProject.id, formData);
            } else {
                await addCustomerProject(formData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving customer project:", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETADO': return 'bg-brand-green/10 text-brand-green border-brand-green/20';
            case 'EN PROGRESO': return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
            default: return 'bg-brand-orange/10 text-brand-orange border-brand-orange/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-brand-highlight tracking-tight">Seguimiento de Clientes</h3>
                    <p className="text-sm text-brand-light">Gestión de proyectos y requerimientos por cliente.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <PlusIcon className="w-4 h-4" /> Nuevo Cliente/Proyecto
                </button>
            </div>

            <div className="bg-white rounded-[32px] overflow-hidden border border-brand-accent shadow-premium">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-secondary/50 border-b border-brand-accent text-[10px] text-brand-light uppercase font-black tracking-[0.2em]">
                                <th className="p-6">Cliente / Proyecto</th>
                                <th className="p-6">Empresa</th>
                                <th className="p-6">Contacto</th>
                                <th className="p-6">Tipo de Trabajo</th>
                                <th className="p-6">Estado</th>
                                <th className="p-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-accent">
                            {customerProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-brand-light italic">No hay proyectos de clientes registrados.</td>
                                </tr>
                            ) : (
                                customerProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-brand-secondary/30 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-black text-brand-highlight">{project.customer_name}</div>
                                            <div className="text-xs text-brand-light font-bold uppercase tracking-tight">{project.project_name}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-brand-secondary text-brand-highlight border border-brand-accent">
                                                {project.company}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-brand-light font-bold text-sm">
                                                <PhoneIcon className="w-3 h-3" />
                                                {project.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-sm font-bold text-brand-highlight">{project.job_type}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(project)}
                                                    className="p-2 rounded-xl text-brand-blue bg-brand-blue/10 hover:bg-brand-blue hover:text-white transition-all"
                                                    title="Editar"
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteCustomerProject(project.id)}
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
                    <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-brand-accent animate-in fade-in zoom-in duration-300">
                        <div className="bg-brand-secondary px-8 py-6 border-b border-brand-accent">
                            <h4 className="text-xl font-black text-brand-highlight tracking-tight">
                                {editingProject ? 'Editar Cliente/Proyecto' : 'Nuevo Seguimiento'}
                            </h4>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Cliente</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                                        value={formData.customer_name}
                                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Proyecto</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                                        value={formData.project_name}
                                        onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Empresa</label>
                                    <select
                                        className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    >
                                        {Object.values(Company).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                        <option value="OTRA">OTRA</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Teléfono</label>
                                    <input
                                        type="text"
                                        className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Tipo de Trabajo</label>
                                <input
                                    type="text"
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                                    value={formData.job_type}
                                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Requerimientos / Notas</label>
                                <textarea
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none transition-all resize-none h-24"
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Estado</label>
                                <select
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none transition-all"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="PRESUPUESTADO">PRESUPUESTADO</option>
                                    <option value="EN PROGRESO">EN PROGRESO</option>
                                    <option value="COMPLETADO">COMPLETADO</option>
                                    <option value="CANCELADO">CANCELADO</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border border-brand-accent text-brand-light hover:bg-brand-secondary transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-brand-orange text-white shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {editingProject ? 'Guardar Cambios' : 'Crear Seguimiento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerTracking;
