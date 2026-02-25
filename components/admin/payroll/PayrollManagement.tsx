import React, { useState, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { User, Role, PaymentPeriod, PayrollEvent, PayrollEventType, PaymentStatus } from '../../../types';
import { ArrowUpIcon, ArrowDownIcon } from '../../Icons';
import { supabase } from '../../../config';

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

    const isAddition = [
        PayrollEventType.BONUS,
        PayrollEventType.OVERTIME
    ].includes(event.tipo);

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
                <p className="font-semibold">{eventTypeMap[event.tipo] || event.tipo}</p>
                <p className="text-xs text-brand-light italic">{event.descripcion}</p>
            </div>
            <p className={`font-bold ${isAddition ? 'text-brand-green' : isDeduction ? 'text-brand-red' : 'text-brand-light'}`}>
                {isAddition ? '+' : isDeduction ? '-' : ''}{formatCurrency(amount)}
            </p>
        </div>
    );
};



const TechnicianPayRow: React.FC<{
    user: User;
    period: PaymentPeriod | undefined;
    onAddEvent: (user: User, date?: string) => void;
    onEditEvent?: (event: PayrollEvent) => void;
    onMarkAsPaid: (periodId: string) => void;
}> = ({ user, period, onAddEvent, onEditEvent, onMarkAsPaid }) => {
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

                <div className="flex gap-2">
                    {period?.estado === PaymentStatus.CALCULATED && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMarkAsPaid(period.id); }}
                            className="bg-brand-green text-brand-primary text-xs font-bold py-1 px-3 rounded hover:bg-green-400 border border-brand-green/50"
                            title="Marcar como Pagado"
                        >
                            Pagar
                        </button>
                    )}
                    {period?.estado !== PaymentStatus.PAID && (
                        <button onClick={(e) => { e.stopPropagation(); onAddEvent(user); }} className="bg-brand-blue text-white text-xs font-semibold py-1 px-3 rounded hover:bg-blue-700">Añadir Evento</button>
                    )}
                </div>
            </div>

            {isExpanded && period && summary && (
                <div className="p-4 border-t border-brand-accent/50 bg-brand-secondary/30 animation-fade-in-down">

                    {/* Timeline Visualization */}
                    <div className="mb-4 bg-brand-primary/50 p-2 rounded">
                        <UserTimeline
                            periodStart={period.fecha_inicio_periodo}
                            periodEnd={period.fecha_fin_periodo}
                            events={period.events || []}
                            attendanceHistory={period.attendanceHistory}
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

    const allUsersForPayroll = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);

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

    const handleMarkSingleAsPaid = async (periodId: string) => {
        if (!window.confirm('¿Confirmar que este monto ha sido pagado?')) return;
        setIsLoading('paying');
        try {
            await markPeriodAsPaid(periodId);
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(null);
        }
    }

    const totalToPay = useMemo(() => calculatedPeriods.reduce((sum, p) => sum + p.monto_final_a_pagar, 0), [calculatedPeriods]);

    const stats = useMemo(() => {
        const byCompany: Record<string, number> = {};
        const byArea: Record<string, number> = {};
        let grandTotal = 0;

        calculatedPeriods.forEach(p => {
            const u = users.find(user => user.id === p.user_id);
            if (!u) return;

            const company = u.company || 'PÚBLICO/SIN EMPRESA';
            const area = u.role || 'SIN ÁREA';

            byCompany[company] = (byCompany[company] || 0) + p.monto_final_a_pagar;
            byArea[area] = (byArea[area] || 0) + p.monto_final_a_pagar;
            grandTotal += p.monto_final_a_pagar;
        });

        return { byCompany, byArea, grandTotal };
    }, [calculatedPeriods, users]);

    const [showHistory, setShowHistory] = useState(false);
    const paidPeriods = useMemo(() => paymentPeriods.filter(p => p.estado === PaymentStatus.PAID), [paymentPeriods]);

    const historyGroups = useMemo(() => {
        const groups: Record<string, PaymentPeriod[]> = {};
        paidPeriods.forEach(p => {
            const date = p.fecha_pago ? p.fecha_pago.split('T')[0] : p.fecha_fin_periodo;
            if (!groups[date]) groups[date] = [];
            groups[date].push(p);
        });
        return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
    }, [paidPeriods]);

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-center sm:text-left">Gestión de Nómina</h2>
                    <p className="text-brand-light">Calcula, revisa y gestiona los pagos quincenales.</p>
                </div>
                <div className="flex bg-brand-primary p-1 rounded-lg">
                    <button
                        onClick={() => setShowHistory(false)}
                        className={`px-4 py-2 rounded-md transition-all ${!showHistory ? 'bg-brand-blue text-white shadow' : 'text-brand-light hover:text-white'}`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setShowHistory(true)}
                        className={`px-4 py-2 rounded-md transition-all ${showHistory ? 'bg-brand-blue text-white shadow' : 'text-brand-light hover:text-white'}`}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {!showHistory ? (
                <>
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
                        </div>
                    </div>

                    {/* ERROR REPAIR UTILITY */}
                    <div className="bg-brand-secondary/50 p-2 mb-4 rounded border border-brand-accent/30 text-xs text-brand-light flex justify-between items-center">
                        <span>¿Los totales siguen sumando en lugar de restar? Ejecuta esta corrección rápida:</span>
                        <button
                            onClick={async () => {
                                if (!confirm('Esto buscará y corregirá eventos con valores negativos en la base de datos. ¿Continuar?')) return;
                                setIsLoading('calculating');
                                try {
                                    // 1. Fetch negative events
                                    const { data: negEvents } = await supabase.from('eventos_nomina').select('*').lt('monto', 0);
                                    if (!negEvents || negEvents.length === 0) {
                                        alert('No se encontraron eventos con error.');
                                    } else {
                                        // 2. Fix them
                                        await Promise.all(negEvents.map(ev =>
                                            supabase.from('eventos_nomina').update({ monto: Math.abs(ev.monto) }).eq('id', ev.id)
                                        ));
                                        alert(`Se corrigieron ${negEvents.length} eventos. Recalculando...`);
                                        await calculatePayPeriods();
                                    }
                                } catch (e) {
                                    console.error(e);
                                    alert('Error al corregir datos');
                                } finally {
                                    setIsLoading(null);
                                }
                            }}
                            disabled={!!isLoading}
                            className="bg-brand-red text-white py-1 px-3 rounded hover:bg-red-700 transition"
                        >
                            Reparar Datos
                        </button>
                    </div>

                    <div className="space-y-4">
                        {allUsersForPayroll.map(person => {
                            const personPeriod = calculatedPeriods.find(p => p.user_id === person.id);
                            return <TechnicianPayRow
                                key={person.id}
                                user={person}
                                period={personPeriod}
                                onAddEvent={onAddEvent}
                                onEditEvent={onEditEvent}
                                onMarkAsPaid={handleMarkSingleAsPaid}
                            />
                        })}
                    </div>

                    {/* ESTADÍSTICAS */}
                    {calculatedPeriods.length > 0 && (
                        <div className="mt-12 p-6 bg-brand-primary rounded-xl border border-brand-accent/30 shadow-2xl animation-fade-in-up">
                            <h3 className="text-xl font-bold text-brand-orange mb-6 flex items-center gap-2 uppercase tracking-widest">
                                <span className="w-2 h-8 bg-brand-orange rounded-full"></span>
                                Estadísticas de Nómina
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Por Empresa */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-brand-light uppercase tracking-wider border-b border-brand-accent/30 pb-2">Por Empresa</h4>
                                    <div className="space-y-3">
                                        {Object.entries(stats.byCompany).map(([name, total]) => (
                                            <div key={name} className="flex justify-between items-center group">
                                                <span className="text-sm font-semibold group-hover:text-brand-blue transition-colors">{name}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 bg-brand-accent/20 rounded-full overflow-hidden hidden sm:block">
                                                        <div className="h-full bg-brand-blue" style={{ width: `${(total / (stats.grandTotal || 1)) * 100}%` }}></div>
                                                    </div>
                                                    <span className="font-bold text-brand-light text-sm">{formatCurrency(total)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Por Área */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-brand-light uppercase tracking-wider border-b border-brand-accent/30 pb-2">Por Área</h4>
                                    <div className="space-y-3">
                                        {Object.entries(stats.byArea).map(([name, total]) => (
                                            <div key={name} className="flex justify-between items-center group">
                                                <span className="text-sm font-semibold group-hover:text-brand-orange transition-colors capitalize">{name.toLowerCase()}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 bg-brand-accent/20 rounded-full overflow-hidden hidden sm:block">
                                                        <div className="h-full bg-brand-orange" style={{ width: `${(total / (stats.grandTotal || 1)) * 100}%` }}></div>
                                                    </div>
                                                    <span className="font-bold text-brand-light text-sm">{formatCurrency(total)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-brand-accent/50 flex justify-between items-center">
                                <span className="text-lg font-bold">TOTAL GLOBAL PROYECTADO</span>
                                <span className="text-2xl font-black text-brand-orange">{formatCurrency(stats.grandTotal)}</span>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-8 animation-fade-in">
                    {historyGroups.map(([date, periods]) => (
                        <div key={date}>
                            <h3 className="text-xl font-bold text-brand-light mb-4 border-b border-brand-accent pb-2">
                                Pago: {new Date(date + 'T00:00:00').toLocaleDateString()}
                            </h3>
                            <div className="space-y-4">
                                {periods.map(period => {
                                    const tech = users.find(u => u.id === period.user_id);
                                    if (!tech) return null;
                                    return (
                                        <TechnicianPayRow
                                            key={period.id}
                                            user={tech}
                                            period={period}
                                            onAddEvent={() => { }} // No-op for history
                                            onEditEvent={() => { }} // No-op for history
                                            onMarkAsPaid={() => { }} // No-op
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {historyGroups.length === 0 && (
                        <div className="text-center py-10 bg-brand-primary rounded-lg text-brand-light italic">
                            No hay historial de pagos registrado.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PayrollManagement;