import React, { useState, useRef } from 'react';
import { useData } from '../../../contexts/DataContext';
import { CustomerProject, CustomerDoc, Company } from '../../../types';
import { PlusIcon, EditIcon, TrashIcon, PhoneIcon } from '../../Icons';
import { supabase } from '../../../config';

const BUCKET = 'customer-docs';

// ---- Kanban columns config ----
const KANBAN_COLUMNS = [
    { id: 'PENDIENTE',      label: 'Para Presupuestar', color: 'amber',  dot: 'bg-amber-400'  },
    { id: 'PRESUPUESTADO',  label: 'Presupuestado',     color: 'purple', dot: 'bg-purple-400' },
    { id: 'ACEPTADO',       label: 'Aceptado',          color: 'blue',   dot: 'bg-blue-400'   },
    { id: 'SEGUIMIENTO',    label: 'Seguimiento',        color: 'green',  dot: 'bg-green-400'  },
] as const;

const KANBAN_COL_STYLES: Record<string, string> = {
    amber:  'border-amber-200  bg-amber-50/60',
    purple: 'border-purple-200 bg-purple-50/60',
    blue:   'border-blue-200   bg-blue-50/60',
    green:  'border-green-200  bg-green-50/60',
};
const KANBAN_HEADER_STYLES: Record<string, string> = {
    amber:  'text-amber-700',
    purple: 'text-purple-700',
    blue:   'text-blue-700',
    green:  'text-green-700',
};

const STATUS_COLORS: Record<string, string> = {
    'COMPLETADO':    'bg-green-100 text-green-700 border-green-200',
    'EN PROGRESO':   'bg-blue-100 text-blue-700 border-blue-200',
    'PRESUPUESTADO': 'bg-purple-100 text-purple-700 border-purple-200',
    'CANCELADO':     'bg-red-100 text-red-700 border-red-200',
    'PENDIENTE':     'bg-amber-100 text-amber-700 border-amber-200',
    'ACEPTADO':      'bg-blue-100 text-blue-700 border-blue-200',
    'SEGUIMIENTO':   'bg-green-100 text-green-700 border-green-200',
};

// ---- Storage helpers ----
async function uploadFile(projectId: string, folder: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${projectId}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    return path;
}

async function getSignedUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error || !data) throw new Error('No se pudo generar el enlace');
    return data.signedUrl;
}

async function deleteStorageFile(path: string) {
    await supabase.storage.from(BUCKET).remove([path]);
}

// ---- Sub-components ----
const DocLink: React.FC<{ doc: CustomerDoc; onDelete?: () => void }> = ({ doc, onDelete }) => {
    const handleOpen = async () => {
        try { window.open(await getSignedUrl(doc.url), '_blank'); }
        catch { alert('No se pudo abrir el archivo.'); }
    };
    const isPdf = doc.name.toLowerCase().endsWith('.pdf');
    return (
        <div className="flex items-center gap-2 bg-brand-secondary rounded-xl px-3 py-2 border border-brand-accent group">
            <span className="text-lg">{isPdf ? '📄' : '🖼️'}</span>
            <button onClick={handleOpen} className="text-xs font-bold text-brand-blue hover:underline truncate max-w-[160px]" title={doc.name}>{doc.name}</button>
            {onDelete && (
                <button onClick={onDelete} className="ml-auto text-brand-light hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100">✕</button>
            )}
        </div>
    );
};

const UploadButton: React.FC<{ label: string; accept: string; loading: boolean; onChange: (f: File) => void }> = ({ label, accept, loading, onChange }) => {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <>
            <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => e.target.files?.[0] && onChange(e.target.files[0])} />
            <button type="button" disabled={loading} onClick={() => ref.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-brand-accent text-brand-light hover:border-brand-blue hover:text-brand-blue text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50">
                {loading ? '⏳ Subiendo...' : `+ ${label}`}
            </button>
        </>
    );
};

// ---- Kanban card ----
const KanbanCard: React.FC<{
    project: CustomerProject;
    onEdit: () => void;
    onDelete: () => void;
    onDragStart: (e: React.DragEvent) => void;
}> = ({ project, onEdit, onDelete, onDragStart }) => (
    <div
        draggable
        onDragStart={onDragStart}
        className="bg-white rounded-2xl border border-brand-accent shadow-sm p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group select-none"
    >
        <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
                <p className="font-black text-sm text-brand-highlight leading-tight truncate">{project.customer_name}</p>
                <p className="text-[11px] text-brand-light font-bold uppercase truncate">{project.project_name}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); onEdit(); }}
                    className="p-1.5 rounded-lg text-brand-blue bg-brand-blue/10 hover:bg-brand-blue hover:text-white transition-all">
                    <EditIcon className="w-3 h-3" />
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all">
                    <TrashIcon className="w-3 h-3" />
                </button>
            </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-secondary text-brand-light border border-brand-accent">
                {project.company}
            </span>
            {project.job_type && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-secondary/50 text-brand-light">
                    {project.job_type}
                </span>
            )}
        </div>

        {project.phone && (
            <div className="flex items-center gap-1 mt-2 text-[11px] text-brand-light font-semibold">
                <PhoneIcon className="w-3 h-3" /> {project.phone}
            </div>
        )}

        <div className="flex gap-2 mt-3">
            {project.presupuesto_url && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">📄 Presupuesto</span>
            )}
            {(project.documentos_cliente ?? []).length > 0 && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    📎 {project.documentos_cliente.length} doc{project.documentos_cliente.length > 1 ? 's' : ''}
                </span>
            )}
        </div>
    </div>
);

// ---- Main component ----
const CustomerTracking: React.FC = () => {
    const { customerProjects, addCustomerProject, updateCustomerProject, deleteCustomerProject } = useData();
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<CustomerProject | null>(null);
    const [uploadingPresupuesto, setUploadingPresupuesto] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);
    const dragId = useRef<string | null>(null);

    const emptyForm = (): {
        customer_name: string; project_name: string; company: string;
        phone: string; job_type: string; requirements: string; status: string;
        presupuesto_url: string | null; documentos_cliente: CustomerDoc[];
    } => ({
        customer_name: '', project_name: '', company: Company.POTABILIZAR,
        phone: '', job_type: '', requirements: '', status: 'PENDIENTE',
        presupuesto_url: null, documentos_cliente: [],
    });

    const [formData, setFormData] = useState(emptyForm());

    const handleOpenModal = (project?: CustomerProject) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                customer_name: project.customer_name,
                project_name: project.project_name,
                company: project.company,
                phone: project.phone ?? '',
                job_type: project.job_type ?? '',
                requirements: project.requirements ?? '',
                status: project.status,
                presupuesto_url: project.presupuesto_url ?? null,
                documentos_cliente: project.documentos_cliente ?? [],
            });
        } else {
            setEditingProject(null);
            setFormData(emptyForm());
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
        } catch (err) { console.error(err); }
    };

    // Drag & drop
    const handleDragStart = (e: React.DragEvent, id: string) => {
        dragId.current = id;
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        setDragOver(null);
        if (!dragId.current) return;
        const project = customerProjects.find(p => p.id === dragId.current);
        if (project && project.status !== targetStatus) {
            await updateCustomerProject(dragId.current, { ...project, status: targetStatus });
        }
        dragId.current = null;
    };

    // File uploads
    const handlePresupuestoUpload = async (file: File) => {
        const tempId = editingProject?.id ?? `tmp-${Date.now()}`;
        setUploadingPresupuesto(true);
        try {
            const path = await uploadFile(tempId, 'presupuesto', file);
            setFormData(prev => ({ ...prev, presupuesto_url: path }));
        } catch (err: any) { alert('Error al subir: ' + err.message); }
        finally { setUploadingPresupuesto(false); }
    };

    const handleClientDocUpload = async (file: File) => {
        const tempId = editingProject?.id ?? `tmp-${Date.now()}`;
        setUploadingDoc(true);
        try {
            const path = await uploadFile(tempId, 'cliente', file);
            const newDoc: CustomerDoc = { name: file.name, url: path, uploaded_at: new Date().toISOString() };
            setFormData(prev => ({ ...prev, documentos_cliente: [...prev.documentos_cliente, newDoc] }));
        } catch (err: any) { alert('Error al subir: ' + err.message); }
        finally { setUploadingDoc(false); }
    };

    const handleRemoveClientDoc = (index: number) => {
        const doc = formData.documentos_cliente[index];
        deleteStorageFile(doc.url).catch(() => {});
        setFormData(prev => ({ ...prev, documentos_cliente: prev.documentos_cliente.filter((_, i) => i !== index) }));
    };

    const handleRemovePresupuesto = () => {
        if (formData.presupuesto_url) deleteStorageFile(formData.presupuesto_url).catch(() => {});
        setFormData(prev => ({ ...prev, presupuesto_url: null }));
    };

    // Projects not in kanban columns (COMPLETADO, CANCELADO, EN PROGRESO legacy)
    const kanbanIds = new Set(KANBAN_COLUMNS.map(c => c.id));
    const otherProjects = customerProjects.filter(p => !kanbanIds.has(p.status));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-brand-highlight tracking-tight">Seguimiento de Clientes</h3>
                    <p className="text-sm text-brand-light">Gestión de proyectos, presupuestos y documentos.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex bg-brand-secondary p-1 rounded-2xl border border-brand-accent">
                        <button onClick={() => setViewMode('kanban')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'kanban' ? 'bg-brand-blue text-white shadow-md' : 'text-brand-light hover:text-brand-highlight'}`}>
                            Kanban
                        </button>
                        <button onClick={() => setViewMode('table')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'table' ? 'bg-brand-blue text-white shadow-md' : 'text-brand-light hover:text-brand-highlight'}`}>
                            Tabla
                        </button>
                    </div>
                    <button onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-brand-orange text-white px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <PlusIcon className="w-4 h-4" /> Nuevo
                    </button>
                </div>
            </div>

            {/* ===== KANBAN VIEW ===== */}
            {viewMode === 'kanban' && (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {KANBAN_COLUMNS.map(col => {
                        const colProjects = customerProjects.filter(p => p.status === col.id);
                        const isOver = dragOver === col.id;
                        return (
                            <div key={col.id}
                                className={`flex-shrink-0 w-72 flex flex-col rounded-3xl border-2 transition-all ${KANBAN_COL_STYLES[col.color]} ${isOver ? 'scale-[1.02] shadow-xl' : ''}`}
                                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                                onDragLeave={() => setDragOver(null)}
                                onDrop={e => handleDrop(e, col.id)}
                            >
                                {/* Column header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                                        <span className={`text-xs font-black uppercase tracking-widest ${KANBAN_HEADER_STYLES[col.color]}`}>{col.label}</span>
                                    </div>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-white/70 ${KANBAN_HEADER_STYLES[col.color]}`}>
                                        {colProjects.length}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div className="flex flex-col gap-3 p-3 flex-1 min-h-[120px]">
                                    {colProjects.map(project => (
                                        <KanbanCard
                                            key={project.id}
                                            project={project}
                                            onEdit={() => handleOpenModal(project)}
                                            onDelete={() => deleteCustomerProject(project.id)}
                                            onDragStart={e => handleDragStart(e, project.id)}
                                        />
                                    ))}
                                    {colProjects.length === 0 && (
                                        <div className={`flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed ${isOver ? 'border-current opacity-40' : 'border-black/10 opacity-20'} min-h-[80px]`}>
                                            <span className="text-xs font-bold">Arrastrar acá</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* "Others" column for COMPLETADO / CANCELADO / legacy */}
                    {otherProjects.length > 0 && (
                        <div className="flex-shrink-0 w-72 flex flex-col rounded-3xl border-2 border-gray-200 bg-gray-50/60">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">Otros</span>
                                </div>
                                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/70 text-gray-500">{otherProjects.length}</span>
                            </div>
                            <div className="flex flex-col gap-3 p-3">
                                {otherProjects.map(project => (
                                    <KanbanCard
                                        key={project.id}
                                        project={project}
                                        onEdit={() => handleOpenModal(project)}
                                        onDelete={() => deleteCustomerProject(project.id)}
                                        onDragStart={e => handleDragStart(e, project.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== TABLE VIEW ===== */}
            {viewMode === 'table' && (
                <div className="bg-white rounded-[32px] overflow-hidden border border-brand-accent shadow-premium">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-brand-secondary/50 border-b border-brand-accent text-[10px] text-brand-light uppercase font-black tracking-[0.2em]">
                                    <th className="p-5">Cliente / Proyecto</th>
                                    <th className="p-5">Empresa</th>
                                    <th className="p-5">Contacto</th>
                                    <th className="p-5">Tipo</th>
                                    <th className="p-5">Presupuesto</th>
                                    <th className="p-5">Docs cliente</th>
                                    <th className="p-5">Estado</th>
                                    <th className="p-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-accent">
                                {customerProjects.length === 0 ? (
                                    <tr><td colSpan={8} className="p-12 text-center text-brand-light italic">No hay proyectos registrados.</td></tr>
                                ) : customerProjects.map(project => (
                                    <React.Fragment key={project.id}>
                                        <tr className="hover:bg-brand-secondary/30 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}>
                                            <td className="p-5">
                                                <div className="font-black text-brand-highlight">{project.customer_name}</div>
                                                <div className="text-xs text-brand-light font-bold uppercase">{project.project_name}</div>
                                            </td>
                                            <td className="p-5">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-brand-secondary text-brand-highlight border border-brand-accent">{project.company}</span>
                                            </td>
                                            <td className="p-5 text-sm font-bold text-brand-light">
                                                <div className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" />{project.phone || '—'}</div>
                                            </td>
                                            <td className="p-5 text-sm font-bold text-brand-highlight">{project.job_type || '—'}</td>
                                            <td className="p-5">
                                                {project.presupuesto_url
                                                    ? <DocLink doc={{ name: 'Presupuesto.pdf', url: project.presupuesto_url, uploaded_at: '' }} />
                                                    : <span className="text-xs text-brand-light italic">Sin adjuntar</span>}
                                            </td>
                                            <td className="p-5">
                                                {(project.documentos_cliente ?? []).length > 0
                                                    ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-brand-blue/10 text-brand-blue border border-brand-blue/20">📎 {project.documentos_cliente.length}</span>
                                                    : <span className="text-xs text-brand-light italic">Sin docs</span>}
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase border ${STATUS_COLORS[project.status] ?? STATUS_COLORS['PENDIENTE']}`}>{project.status}</span>
                                            </td>
                                            <td className="p-5 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(project)} className="p-2 rounded-xl text-brand-blue bg-brand-blue/10 hover:bg-brand-blue hover:text-white transition-all"><EditIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteCustomerProject(project.id)} className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === project.id && (
                                            <tr className="bg-brand-secondary/20">
                                                <td colSpan={8} className="px-8 py-5">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-light mb-2">Requerimientos / Notas</p>
                                                            <p className="text-sm text-brand-highlight font-semibold whitespace-pre-wrap">{project.requirements || '—'}</p>
                                                        </div>
                                                        {(project.documentos_cliente ?? []).length > 0 && (
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-light mb-2">Documentos del cliente</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {project.documentos_cliente.map((doc, i) => <DocLink key={i} doc={doc} />)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== MODAL ===== */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-brand-highlight/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-brand-accent">
                        <div className="bg-brand-secondary px-8 py-6 border-b border-brand-accent sticky top-0 z-10">
                            <h4 className="text-xl font-black text-brand-highlight tracking-tight">
                                {editingProject ? 'Editar Cliente / Proyecto' : 'Nuevo Seguimiento'}
                            </h4>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest">Cliente</label>
                                    <input required className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest">Proyecto</label>
                                    <input required className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none" value={formData.project_name} onChange={e => setFormData({ ...formData, project_name: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest">Empresa</label>
                                    <select className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}>
                                        {Object.values(Company).map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="OTRA">OTRA</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest">Teléfono</label>
                                    <input className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest">Tipo de Trabajo</label>
                                    <input className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none" value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase tracking-widest">Estado</label>
                                    <select className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="PENDIENTE">Para Presupuestar</option>
                                        <option value="PRESUPUESTADO">Presupuestado</option>
                                        <option value="ACEPTADO">Aceptado</option>
                                        <option value="SEGUIMIENTO">Seguimiento</option>
                                        <option value="COMPLETADO">Completado</option>
                                        <option value="CANCELADO">Cancelado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase tracking-widest">Requerimientos / Notas</label>
                                <textarea className="w-full bg-brand-secondary border border-brand-accent rounded-2xl px-4 py-3 font-bold text-brand-highlight focus:ring-2 focus:ring-brand-orange outline-none resize-none h-24" value={formData.requirements} onChange={e => setFormData({ ...formData, requirements: e.target.value })} />
                            </div>

                            {/* Presupuesto */}
                            <div className="space-y-3 p-5 bg-brand-secondary/50 rounded-2xl border border-brand-accent">
                                <p className="text-[10px] font-black text-brand-light uppercase tracking-widest">📄 Presupuesto enviado al cliente (PDF)</p>
                                {formData.presupuesto_url ? (
                                    <div className="flex items-center gap-3">
                                        <DocLink doc={{ name: 'Presupuesto.pdf', url: formData.presupuesto_url, uploaded_at: '' }} />
                                        <button type="button" onClick={handleRemovePresupuesto} className="text-xs text-brand-red font-black hover:underline">Eliminar</button>
                                        <UploadButton label="Reemplazar" accept=".pdf" loading={uploadingPresupuesto} onChange={handlePresupuestoUpload} />
                                    </div>
                                ) : (
                                    <UploadButton label="Subir PDF presupuesto" accept=".pdf" loading={uploadingPresupuesto} onChange={handlePresupuestoUpload} />
                                )}
                            </div>

                            {/* Docs cliente */}
                            <div className="space-y-3 p-5 bg-brand-secondary/50 rounded-2xl border border-brand-accent">
                                <p className="text-[10px] font-black text-brand-light uppercase tracking-widest">🖼️ Documentos / imágenes del cliente</p>
                                {formData.documentos_cliente.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.documentos_cliente.map((doc, i) => (
                                            <DocLink key={i} doc={doc} onDelete={() => handleRemoveClientDoc(i)} />
                                        ))}
                                    </div>
                                )}
                                <UploadButton label="Agregar archivo (PDF / imagen)" accept=".pdf,.jpg,.jpeg,.png,.webp" loading={uploadingDoc} onChange={handleClientDocUpload} />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border border-brand-accent text-brand-light hover:bg-brand-secondary transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-brand-orange text-white shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all">
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
