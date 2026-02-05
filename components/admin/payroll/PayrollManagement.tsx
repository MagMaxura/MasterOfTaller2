import React, { useState, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { User, Role, PaymentPeriod, PayrollEvent, PayrollEventType, PaymentStatus } from '../../../types';
import { ArrowUpIcon, ArrowDownIcon } from '../../Icons';

const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

import UserTimeline from './UserTimeline';

const EventRow: React.FC<{ event: PayrollEvent }> = ({ event }) => {
    const isDeduction = [
        PayrollEventType.ABSENCE,
        PayrollEventType.TARDINESS,
        PayrollEventType.PENALTY,
        PayrollEventType.LOAN,
        PayrollEventType.EARLY_DEPARTURE
    ].includes(event.tipo);

    const isPositiveType = !isDeduction;
    const amount = Math.abs(event.monto);

    const eventTypeMap: Record<PayrollEventType, string> = {
        [PayrollEventType.BONUS]: 'Bono',
        [PayrollEventType.OVERTIME]: 'Hora Extra',
        [PayrollEventType.PENALTY]: 'Apercibimiento',
        [PayrollEventType.ABSENCE]: 'Falta',
        [PayrollEventType.TARDINESS]: 'Tardanza',
        [PayrollEventType.LOAN]: 'Préstamo',
        [PayrollEventType.EARLY_DEPARTURE]: 'Salida Temprana',
        [PayrollEventType.VACATION]: 'Vacaciones',
        [PayrollEventType.SICK_LEAVE]: 'Enfermedad',
        [PayrollEventType.PERMITTED_LEAVE]: 'Permiso',
    };
    return (
        <div className="flex justify-between items-center py-2 border-b border-brand-accent/50 text-sm">
            <div>
                <p className="font-semibold">{eventTypeMap[event.tipo]}</p>
                <p className="text-xs text-brand-light italic">{event.descripcion}</p>
            </div>
            <p className={`font-bold ${isPositiveType ? 'text-brand-green' : 'text-brand-red'}`}>
                {isPositiveType ? '+' : '-'}{formatCurrency(amount)}
            </p>
        </div>
    );
};


const TechnicianPayRow: React.FC<{
    user: User;
    period: PaymentPeriod | undefined;
    onAddEvent: (user: User, date?: string) => void;
    onEditEvent?: (event: PayrollEvent) => void;
}> = ({ user, period, onAddEvent, onEditEvent }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Group events for summary
    const summary = useMemo(() => {
        if (!period) return null;
        const s = {
            base: period.salario_base_calculado,
            prestamos: 0,
            demoras: 0, // Tardanza + Salida Temprana
            faltas: 0,
            extras: 0,
            bonos: 0, // Bonos + Premios
            otros_descuentos: 0
        };

        (period.events || []).forEach(e => {
            const m = Math.abs(Number(e.monto));
            switch (e.tipo) {
                case PayrollEventType.LOAN:
                    s.prestamos += m;
                    break;
                case PayrollEventType.TARDINESS:
                case PayrollEventType.EARLY_DEPARTURE:
                    s.demoras += m;
                    break;
                case PayrollEventType.ABSENCE:
                    s.faltas += m;
                    break;
                case PayrollEventType.OVERTIME:
                    s.extras += m;
                    break;
                case PayrollEventType.BONUS:
                    s.bonos += m;
                    break;
                case PayrollEventType.PENALTY:
                    s.otros_descuentos += m;
                    break;
            }
        });
        return s;
    }, [period]);

    return (
        <div className="bg-brand-primary rounded-lg overflow-hidden">
            <div onClick={() => setIsExpanded(!isExpanded)} className="flex items-center p-4 cursor-pointer hover:bg-brand-accent/20 transition-colors">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-4" />
                <div className="flex-grow">
                    <p className="font-bold">{user.name}</p>
                    <p className="text-xs text-brand-light">
                        {period ?
                            `Período: ${new Date(period.fecha_inicio_periodo + 'T00:00:00').toLocaleDateString()} - ${new Date(period.fecha_fin_periodo + 'T00:00:00').toLocaleDateString()}`
                            : 'Sin pago calculado'}
                    </p>
                </div>
                {period && (
                    <span className={`px-3 py-1 text-xs font-bold rounded-full mr-4 ${period.estado === PaymentStatus.PAID ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-orange/20 text-brand-orange'}`}>
                        {period.estado}
                    </span>
                )}
                <div className="font-bold text-lg mr-4">{period ? formatCurrency(period.monto_final_a_pagar) : '-'}</div>
                <button onClick={(e) => { e.stopPropagation(); onAddEvent(user); }} className="bg-brand-blue text-white text-xs font-semibold py-1 px-3 rounded hover:bg-blue-700">Añadir Evento</button>
            </div>

            {isExpanded && period && summary && (
                <div className="p-4 border-t border-brand-accent/50 bg-brand-secondary/30 animation-fade-in-down">

                    {/* Timeline Visualization */}
                    <div className="mb-4 bg-brand-primary/50 p-2 rounded">
                        <UserTimeline
                            periodStart={period.fecha_inicio_periodo}
                            periodEnd={period.fecha_fin_periodo}
                            events={period.events || []}
                            onDayClick={(date) => onAddEvent(user, date.toISOString().split('T')[0])}
                            onEventClick={onEditEvent}
                        />
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center p-2 rounded hover:bg-white/5">
                            <p className="text-brand-light">Valor Quincena (Base)</p>
                            <p className="font-bold">{formatCurrency(summary.base)}</p>
                        </div>

                        {/* DEDUCCIONES */}
                        {summary.prestamos > 0 && (
                            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 text-brand-red">
                                <p>Préstamos</p>
                                <p>- {formatCurrency(summary.prestamos)}</p>
                            </div>
                        )}
                        {summary.demoras > 0 && (
                            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 text-brand-red">
                                <p>Demoras o Salidas Tempranas</p>
                                <p>- {formatCurrency(summary.demoras)}</p>
                            </div>
                        )}
                        {summary.faltas > 0 && (
                            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 text-brand-red">
                                <p>Faltas</p>
                                <p>- {formatCurrency(summary.faltas)}</p>
                            </div>
                        )}
                        {summary.otros_descuentos > 0 && (
                            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 text-brand-red">
                                <p>Otros Descuentos (Apercibimientos)</p>
                                <p>- {formatCurrency(summary.otros_descuentos)}</p>
                            </div>
                        )}

                        {/* ADICIONES */}
                        {summary.extras > 0 && (
                            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 text-brand-green">
                                <p>Horas Extras</p>
                                <p>+ {formatCurrency(summary.extras)}</p>
                            </div>
                        )}
                        {summary.bonos > 0 && (
                            <div className="flex justify-between items-center p-2 rounded hover:bg-white/5 text-brand-green">
                                <p>Bonos y Premios</p>
                                <p>+ {formatCurrency(summary.bonos)}</p>
                            </div>
                        )}

                        <div className="border-t border-brand-accent my-2"></div>

                        <div className="flex justify-between text-lg font-bold pt-2">
                            <p>TOTAL A PAGAR</p>
                            <p className="text-brand-gold">{formatCurrency(period.monto_final_a_pagar)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface PayrollManagementProps {
    onAddEvent: (user: User, date?: string) => void;
    onEditEvent?: (event: PayrollEvent) => void;
}

const PayrollManagement: React.FC<PayrollManagementProps> = ({ onAddEvent, onEditEvent }) => {
    const { users, paymentPeriods, calculatePayPeriods, markPeriodAsPaid } = useData();
    const [isLoading, setIsLoading] = useState<'calculating' | 'paying' | null>(null);

    const technicians = useMemo(() => users.filter(u => u.role === Role.TECHNICIAN), [users]);

    const calculatedPeriods = useMemo(() => paymentPeriods.filter(p => p.estado === PaymentStatus.CALCULATED), [paymentPeriods]);

    const nextPayDate = useMemo(() => {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth();
        const year = today.getFullYear();
        if (day <= 5) return new Date(year, month, 5);
        if (day <= 20) return new Date(year, month, 20);
        return new Date(year, month + 1, 5);
    }, []);

    const handleCalculate = async () => {
        setIsLoading('calculating');
        try {
            await calculatePayPeriods();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(null);
        }
    }

    const handleMarkAllAsPaid = async () => {
        if (calculatedPeriods.length === 0) return;
        if (!window.confirm(`¿Confirmar el pago de ${calculatedPeriods.length} nóminas? Esta acción es irreversible.`)) return;
        setIsLoading('paying');
        try {
            await Promise.all(calculatedPeriods.map(p => markPeriodAsPaid(p.id)));
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(null);
        }
    }

    const totalToPay = useMemo(() => calculatedPeriods.reduce((sum, p) => sum + p.monto_final_a_pagar, 0), [calculatedPeriods]);

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold mb-2 text-center">Gestión de Nómina</h2>
            <p className="text-center text-brand-light mb-6">Calcula, revisa y gestiona los pagos quincenales.</p>

            <div className="bg-brand-primary p-4 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h4 className="font-bold text-lg">Próximo Pago: {nextPayDate.toLocaleDateString()}</h4>
                    <p className="text-brand-light text-sm">Total calculado a pagar: <span className="font-bold text-brand-orange text-base">{formatCurrency(totalToPay)}</span></p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCalculate} disabled={!!isLoading} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                        {isLoading === 'calculating' && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                        Calcular Nómina
                    </button>
                    <button onClick={handleMarkAllAsPaid} disabled={!!isLoading || calculatedPeriods.length === 0} className="bg-brand-green text-brand-primary font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                        {isLoading === 'paying' && <div className="w-5 h-5 border-2 border-t-transparent border-brand-primary rounded-full animate-spin"></div>}
                        Marcar como Pagado
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {technicians.map(tech => {
                    const techPeriod = calculatedPeriods.find(p => p.user_id === tech.id);
                    return <TechnicianPayRow key={tech.id} user={tech} period={techPeriod} onAddEvent={onAddEvent} onEditEvent={onEditEvent} />
                })}
            </div>
        </div>
    );
};

export default PayrollManagement;