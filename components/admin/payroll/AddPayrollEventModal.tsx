
import React, { useState, useEffect, useMemo } from 'react';
import { User, PayrollEvent, PayrollEventType } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';

interface AddPayrollEventModalProps {
    user: User;
    onClose: () => void;
    initialDate?: string;
    event?: PayrollEvent;
}

const AddPayrollEventModal: React.FC<AddPayrollEventModalProps> = ({ user, onClose, initialDate, event }) => {
    if (!user) {
        console.error('[AddPayrollEventModal] ERROR: No user provided to modal');
        return null;
    }
    const { addPayrollEvent, updatePayrollEvent, deletePayrollEvent, salaries, calculatePayPeriods } = useData();
    const { showToast } = useToast();

    const [tipo, setTipo] = useState<PayrollEventType>(event?.tipo || PayrollEventType.BONUS);
    const [monto, setMonto] = useState<number | ''>(event?.monto !== undefined ? Math.abs(event.monto) : '');
    const [descripcion, setDescripcion] = useState(event?.descripcion || '');
    const [fecha, setFecha] = useState(event?.fecha_evento || initialDate || new Date().toISOString().split('T')[0]);
    const [horas, setHoras] = useState<number | ''>('');
    const [justificado, setJustificado] = useState(event?.justificado || false);
    const [notasJustificacion, setNotasJustificacion] = useState(event?.notas_justificacion || '');
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

    // Hourly Rate Calculation: (Salary / 10) / 8
    const hourlyRate = useMemo(() => {
        if (!userSalary) return 0;
        return (userSalary / 10) / 8;
    }, [userSalary]);

    // Auto-populate hours if editing and description contains a time (e.g. 1.25 h or 1.25 hs)
    useEffect(() => {
        if (event && isTimeBased && !horas) {
            // Match "0.25 h", "0.25 hs", "(0.25 h)", etc.
            const match = event.descripcion.match(/(\d+(\.\d+)?)\s*h(s)?/i);
            if (match) {
                setHoras(parseFloat(match[1]));
            }
        }
    }, [event, isTimeBased]);

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

    // Auto-populate monto for absences if new
    useEffect(() => {
        if (tipo === PayrollEventType.ABSENCE && monto === '' && userSalary) {
            setMonto(Math.round((userSalary / 10) * 100) / 100);
        }
    }, [tipo, userSalary, monto]);

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
        const finalDescription = isTimeBased && horas ? `${descripcion} (${horas} hs)` : descripcion;

        setIsLoading(true);
        try {
            if (event) {
                await updatePayrollEvent(event.id, {
                    tipo,
                    monto: finalAmount,
                    descripcion: finalDescription,
                    fecha_evento: fecha,
                    // @ts-ignore
                    justificado,
                    notas_justificacion: notasJustificacion
                });
                showToast('Evento actualizado con éxito.', 'success');
            } else {
                await addPayrollEvent({
                    user_id: user.id,
                    tipo,
                    monto: finalAmount,
                    descripcion: finalDescription,
                    fecha_evento: fecha,
                    // @ts-ignore
                    justificado,
                    notas_justificacion: notasJustificacion
                });
                showToast('Evento de nómina añadido con éxito.', 'success');
            }

            // Trigger recalculation to link event and update totals
            try {
                await calculatePayPeriods();
            } catch (calcError) {
                console.error("Auto-recalculation failed:", calcError);
                // Don't block success message if recalc fails, but log it.
            }

            onClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error al procesar el evento.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!event) return;
        if (!window.confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

        setIsLoading(true);
        try {
            await deletePayrollEvent(event.id);
            await calculatePayPeriods();
            showToast('Evento eliminado con éxito.', 'success');
            onClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error al eliminar el evento.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-brand-secondary rounded-lg max-w-lg w-full p-6 relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-2">{event ? 'Editar' : 'Añadir'} Evento de Nómina</h3>
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
                                <input type="number" step="0.25" value={horas} onChange={e => setHoras(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Ej: 1.25" className="w-full bg-brand-primary p-3 rounded border border-brand-accent focus:border-brand-blue" />
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

                    { (tipo === PayrollEventType.ABSENCE || tipo === PayrollEventType.TARDINESS || tipo === PayrollEventType.EARLY_DEPARTURE || tipo === PayrollEventType.PENALTY) && (
                        <div className="bg-brand-blue/5 p-4 rounded-lg border border-brand-blue/20 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-brand-blue flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue"></div>
                                Sistema de Justificación de Falta
                            </h4>
                            <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">Estado de la Falta</label>
                                <select 
                                    value={justificado ? 'true' : 'false'} 
                                    onChange={e => {
                                        const val = e.target.value === 'true';
                                        setJustificado(val);
                                        if (val) {
                                            setMonto(0);
                                        } else if (tipo === PayrollEventType.ABSENCE && userSalary) {
                                            setMonto(Math.round((userSalary / 10) * 100) / 100);
                                        } else if (isTimeBased && horas) {
                                            const h = Number(horas);
                                            const rate = tipo === PayrollEventType.OVERTIME ? hourlyRate * 1.5 : hourlyRate;
                                            setMonto(Math.round(rate * h * 100) / 100);
                                        } else if (tipo === PayrollEventType.PENALTY && userSalary) {
                                            setMonto(Math.round((userSalary / 20) * 100) / 100); // 1/2 día
                                        }
                                    }} 
                                    className="w-full bg-brand-primary p-3 rounded border border-brand-accent"
                                >
                                    <option value="false">No Justificado (Descuenta de Nómina)</option>
                                    <option value="true">Justificado / Perdonado (No descuenta)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">Notas / Justificación</label>
                                <textarea 
                                    value={notasJustificacion} 
                                    onChange={e => setNotasJustificacion(e.target.value)} 
                                    placeholder="Ej: Presentó certificado médico por gripe..."
                                    className="w-full bg-brand-primary p-3 rounded border border-brand-accent min-h-[80px]"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    {event && (
                        <button type="button" onClick={handleDelete} disabled={isLoading} className="flex-1 bg-brand-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                            Eliminar
                        </button>
                    )}
                    <button type="submit" disabled={isLoading} className={`flex-[2] ${event ? 'bg-brand-green' : 'bg-brand-blue'} text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent`}>
                        {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                        {event ? 'Guardar Cambios' : 'Añadir Evento'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPayrollEventModal;
