import React, { useState } from 'react';
import { User, PayrollEventType } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';

interface AddPayrollEventModalProps {
    user: User;
    onClose: () => void;
}

const AddPayrollEventModal: React.FC<AddPayrollEventModalProps> = ({ user, onClose }) => {
    const { addPayrollEvent } = useData();
    const { showToast } = useToast();
    
    const [tipo, setTipo] = useState<PayrollEventType>(PayrollEventType.BONUS);
    const [monto, setMonto] = useState<number | ''>('');
    const [descripcion, setDescripcion] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);

    const isDeduction = [PayrollEventType.ABSENCE, PayrollEventType.TARDINESS, PayrollEventType.PENALTY].includes(tipo);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (monto === '' || !descripcion.trim() || !fecha) {
            showToast('Todos los campos son obligatorios.', 'error');
            return;
        }

        const finalAmount = isDeduction ? -Math.abs(monto) : Math.abs(monto);
        
        setIsLoading(true);
        try {
            await addPayrollEvent({
                user_id: user.id,
                tipo,
                monto: finalAmount,
                descripcion,
                fecha_evento: fecha,
            });
            showToast('Evento de nómina añadido con éxito.', 'success');
            onClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error al añadir el evento.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-brand-secondary rounded-lg max-w-lg w-full p-6 relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-2">Añadir Evento de Nómina</h3>
                <p className="text-brand-light mb-6">para {user.name}</p>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-light mb-1">Tipo de Evento</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value as PayrollEventType)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent">
                                <option value={PayrollEventType.BONUS}>Bono (+)</option>
                                <option value={PayrollEventType.OVERTIME}>Hora Extra (+)</option>
                                <option value={PayrollEventType.PENALTY}>Apercibimiento (-)</option>
                                <option value={PayrollEventType.TARDINESS}>Tardanza (-)</option>
                                <option value={PayrollEventType.ABSENCE}>Falta (-)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-light mb-1">Monto ($)</label>
                             <input type="number" value={monto} onChange={e => setMonto(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Ej: 5000" className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required min="0" />
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-brand-light mb-1">Descripción</label>
                         <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Bono por desempeño excelente" className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                    </div>
                     <div>
                         <label className="block text-sm font-medium text-brand-light mb-1">Fecha del Evento</label>
                         <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required />
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full mt-6 bg-brand-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                    {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                    Añadir Evento
                </button>
            </form>
        </div>
    );
};

export default AddPayrollEventModal;
