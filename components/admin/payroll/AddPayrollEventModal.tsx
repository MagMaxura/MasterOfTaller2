import React, { useState, useEffect, useMemo } from 'react';
import { User, PayrollEventType } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';

interface AddPayrollEventModalProps {
    user: User;
    onClose: () => void;
    initialDate?: string;
}

const AddPayrollEventModal: React.FC<AddPayrollEventModalProps> = ({ user, onClose, initialDate }) => {
    const { addPayrollEvent, salaries, calculatePayPeriods } = useData();
    const { showToast } = useToast();

    const [tipo, setTipo] = useState<PayrollEventType>(PayrollEventType.BONUS);
    const [monto, setMonto] = useState<number | ''>('');
    const [descripcion, setDescripcion] = useState('');
    const [fecha, setFecha] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const [horas, setHoras] = useState<number | ''>('');
    const [isLoading, setIsLoading] = useState(false);

    const isDeduction = [
        PayrollEventType.ABSENCE,
        PayrollEventType.TARDINESS,
        PayrollEventType.PENALTY,
        PayrollEventType.LOAN,
        PayrollEventType.EARLY_DEPARTURE
    ].includes(tipo);

    const isTimeBased = [
        PayrollEventType.OVERTIME,
        PayrollEventType.TARDINESS,
        PayrollEventType.EARLY_DEPARTURE
    ].includes(tipo);

    // Get user base salary
    const userSalary = useMemo(() => {
        const s = salaries.find(s => s.user_id === user.id);
        return s ? s.monto_base_quincenal : 0;
    }, [salaries, user.id]);

    // Hourly Rate Calculation: (Salary / 10) / 9
    const hourlyRate = useMemo(() => {
        if (!userSalary) return 0;
        return (userSalary / 10) / 9;
    }, [userSalary]);

    // Auto-calculate amount when hours or type changes
    useEffect(() => {
        if (!isTimeBased || horas === '' || horas === 0) return;

        let calculated = 0;
        const h = Number(horas);

        if (tipo === PayrollEventType.OVERTIME) {
            calculated = hourlyRate * 1.5 * h;
        } else {
            // Tardiness or Early Departure
            calculated = hourlyRate * h;
        }

        // Round to 2 decimals
        setMonto(Math.round(calculated * 100) / 100);
    }, [horas, tipo, hourlyRate, isTimeBased]);

    // Reset formatted hours/amount when type changes out of time-based
    useEffect(() => {
        if (!isTimeBased) {
            setHoras('');
        }
    }, [isTimeBased]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (monto === '' || !descripcion.trim() || !fecha) {
            showToast('Todos los campos son obligatorios.', 'error');
            return;
        }

        const finalAmount = Math.abs(monto);

        setIsLoading(true);
        try {
            await addPayrollEvent({
                user_id: user.id,
                tipo,
                monto: finalAmount,
                descripcion: isTimeBased && horas ? `${descripcion} (${horas} hs)` : descripcion,
                fecha_evento: fecha,
            });

            // Trigger recalculation to link event and update totals
            try {
                await calculatePayPeriods();
            } catch (calcError) {
                console.error("Auto-recalculation failed:", calcError);
                // Don't block success message if recalc fails, but log it.
            }

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
                <p className="text-brand-light mb-6">para {user.name} {userSalary > 0 && <span className="text-xs text-brand-green bg-brand-green/10 px-2 py-1 rounded ml-2">Sueldo Base: ${userSalary}</span>}</p>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-light mb-1">Tipo de Evento</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value as PayrollEventType)} className="w-full bg-brand-primary p-3 rounded border border-brand-accent">
                                <optgroup label="Adiciones (+)">
                                    <option value={PayrollEventType.BONUS}>Bono</option>
                                    <option value={PayrollEventType.OVERTIME}>Hora Extra</option>
                                </optgroup>
                                <optgroup label="Deducciones (-)">
                                    <option value={PayrollEventType.ABSENCE}>Falta</option>
                                    <option value={PayrollEventType.TARDINESS}>Tardanza / Demora</option>
                                    <option value={PayrollEventType.EARLY_DEPARTURE}>Salida Temprana</option>
                                    <option value={PayrollEventType.LOAN}>Préstamo</option>
                                    <option value={PayrollEventType.PENALTY}>Apercibimiento</option>
                                </optgroup>
                                <optgroup label="Novedades (Neutras/Informativas)">
                                    <option value={PayrollEventType.VACATION}>Vacaciones</option>
                                    <option value={PayrollEventType.SICK_LEAVE}>Enfermedad</option>
                                    <option value={PayrollEventType.PERMITTED_LEAVE}>Permiso</option>
                                </optgroup>
                            </select>
                        </div>

                        {isTimeBased ? (
                            <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">Horas</label>
                                <input type="number" step="0.5" value={horas} onChange={e => setHoras(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Ej: 1.5" className="w-full bg-brand-primary p-3 rounded border border-brand-accent focus:border-brand-blue" />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">Monto ($)</label>
                                <input type="number" value={monto} onChange={e => setMonto(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Ej: 5000" className="w-full bg-brand-primary p-3 rounded border border-brand-accent" required min="0" />
                            </div>
                        )}
                    </div>

                    {isTimeBased && (
                        <div>
                            <label className="block text-sm font-medium text-brand-light mb-1">Monto Calculado ($)</label>
                            <input type="number" value={monto} onChange={e => setMonto(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full bg-brand-primary p-3 rounded border border-brand-accent text-brand-gold font-bold" required min="0" />
                            <p className="text-xs text-brand-light mt-1">Valor hora base: ${Math.round(hourlyRate * 100) / 100} {tipo === PayrollEventType.OVERTIME && '(x1.5 para extras)'}</p>
                        </div>
                    )}

                    {!isTimeBased && (
                        <div></div> // Spacer in grid if not used, but here we are in flex-col space-y-4
                    )}


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
