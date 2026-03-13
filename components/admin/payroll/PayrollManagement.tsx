import React, { useState, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { User, Role, PaymentPeriod, PayrollEvent, PayrollEventType, PaymentStatus } from '../../../types';
import { ArrowUpIcon, ArrowDownIcon } from '../../Icons';
import { supabase } from '../../../config';

const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

import UserTimeline from './UserTimeline';
import ScheduleModal from './ScheduleModal';
import { ClockIcon, CurrencyDollarIcon, CreditCardIcon } from '../../Icons';
import PartialPaymentModal from './PartialPaymentModal';

const EventRow: React.FC<{ event: PayrollEvent; onEdit: (e: PayrollEvent) => void }> = ({ event, onEdit }) => {
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
        <div 
            onClick={(e) => { 
                e.stopPropagation(); 
                console.log('EventRow clicked:', event.id, event.tipo);
                if (typeof onEdit === 'function') {
                    onEdit(event);
                } else {
                    console.error('onEdit is not a function in EventRow', onEdit);
                }
            }}
            className="flex justify-between items-center py-2 px-3 border-b border-brand-accent/30 text-sm hover:bg-white/5 cursor-pointer transition-colors rounded select-none group"
        >
            <div className="flex-grow">
                <p className="font-semibold">
                    {eventTypeMap[event.tipo] || event.tipo} 
                    <span className="text-[10px] text-brand-light font-normal ml-2">{new Date(event.fecha_evento + 'T00:00:00').toLocaleDateString()}</span>
                    {event.justificado && (
                        <span className="bg-brand-blue/10 text-brand-blue text-[9px] font-black uppercase px-2 py-0.5 rounded ml-2">Justificada</span>
                    )}
                </p>
                <p className="text-xs text-brand-light italic">{event.descripcion}</p>
                {event.notas_justificacion && (
                    <p className="text-[10px] text-brand-blue/70 mt-0.5">Nota: {event.notas_justificacion}</p>
                )}
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
    onEditEvent: (event: PayrollEvent) => void;
    onEditSchedule: (user: User) => void;
    onMarkAsPaid: (periodId: string) => void;
    onPartialPayment: (period: PaymentPeriod) => void;
}> = ({ user, period, onAddEvent, onEditEvent, onEditSchedule, onMarkAsPaid, onPartialPayment }) => {
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
        <div className="bg-brand-primary rounded-lg overflow-hidden border border-white/5 transition-all">
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex flex-col sm:flex-row items-start sm:items-center p-4 cursor-pointer hover:bg-brand-accent/20 transition-colors gap-4"
            >
                <div className="flex items-center w-full sm:w-auto">
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full mr-4 border border-white/10" />
                    <div className="flex-grow">
                        <div className="flex items-center gap-2">
                            <p className="font-black text-brand-highlight">{user.name}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEditSchedule && onEditSchedule(user); }}
                                className="p-1.5 bg-white/5 hover:bg-brand-blue/10 rounded-lg text-brand-light hover:text-brand-blue transition-all"
                                title="Configurar Horario y Vacaciones"
                            >
                                <ClockIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] sm:text-xs text-brand-light opacity-80 mt-0.5">
                            {period ?
                                `Período: ${new Date(period.fecha_inicio_periodo + 'T00:00:00').toLocaleDateString()} - ${new Date(period.fecha_fin_periodo + 'T00:00:00').toLocaleDateString()}`
                                : 'Sin pago calculado'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between w-full sm:w-auto sm:flex-grow sm:justify-end gap-3 sm:gap-6">
                    {period && (
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm ${period.estado === PaymentStatus.PAID ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' : 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'}`}>
                            {period.estado}
                        </span>
                    )}

                    <div className="flex flex-col items-end">
                        <div className="font-black text-xl text-brand-gold">
                            {period ? formatCurrency(period.monto_final_a_pagar) : '-'}
                        </div>
                        {period && (period.monto_pagado_acumulado || 0) > 0 && (
                            <p className="text-[10px] font-bold text-brand-green bg-brand-green/5 px-2 py-0.5 rounded mt-0.5">
                                Pagado: {formatCurrency(period.monto_pagado_acumulado || 0)}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                        {period?.estado === PaymentStatus.CALCULATED && (
                            <div className="flex gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMarkAsPaid && onMarkAsPaid(period.id); }}
                                    className="flex-1 sm:flex-none bg-brand-green text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl hover:bg-green-500 transition-all shadow-lg active:scale-95"
                                >
                                    Pagar
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPartialPayment && onPartialPayment(period); }}
                                    className="flex-1 sm:flex-none bg-brand-accent text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl hover:bg-brand-accent/80 transition-all shadow-lg active:scale-95 flex items-center gap-1.5 border border-white/10"
                                    title="Registar Pago Parcial"
                                >
                                    <CreditCardIcon className="w-3.5 h-3.5" />
                                    <span>Parcial</span>
                                </button>
                            </div>
                        )}
                        {period?.estado !== PaymentStatus.PAID && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddEvent && onAddEvent(user); }}
                                className="flex-1 sm:flex-none bg-brand-blue text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                            >
                                Evento
                            </button>
                        )}
                    </div>
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
                            onDayClick={(date) => onAddEvent && onAddEvent(user, date.toISOString().split('T')[0])}
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

                        {period && (period.monto_pagado_acumulado || 0) > 0 && (
                            <>
                                <div className="flex justify-between text-brand-green font-bold">
                                    <p>PAGADO ACUMULADO</p>
                                    <p>- {formatCurrency(period.monto_pagado_acumulado || 0)}</p>
                                </div>
                                <div className="flex justify-between text-brand-orange text-xl font-black border-t border-brand-orange/30 pt-2 mt-2">
                                    <p>SALDO PENDIENTE</p>
                                    <p>{formatCurrency(period.monto_final_a_pagar - (period.monto_pagado_acumulado || 0))}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* DETALLE DE EVENTOS */}
                    {period.events && period.events.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-brand-accent/30">
                            <h5 className="text-[10px] uppercase font-black tracking-widest text-brand-light mb-2">Desglose de Eventos (Click para editar)</h5>
                            <div className="space-y-1">
                                {period.events
                                    .sort((a, b) => new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime())
                                    .map(ev => (
                                        <EventRow 
                                            key={ev.id} 
                                            event={ev} 
                                            onEdit={onEditEvent} 
                                        />
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface PayrollManagementProps {
    onAddEvent: (user: User, date?: string) => void;
    onEditEvent: (event: PayrollEvent) => void;
}

const PayrollManagement: React.FC<PayrollManagementProps> = ({ onAddEvent, onEditEvent }) => {
    const { users, paymentPeriods, userSchedules, calculatePayPeriods, markPeriodAsPaid, registrarPagoParcial, updateUserSchedule } = useData();
    const [isLoading, setIsLoading] = useState<'calculating' | 'paying' | null>(null);
    const [editingScheduleUser, setEditingScheduleUser] = useState<User | null>(null);
    const [partialPayPeriod, setPartialPayPeriod] = useState<PaymentPeriod | null>(null);

    const allUsersForPayroll = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);

    const calculatedPeriods = useMemo(() => {
        // Get only periods that overlap with "now" or are within the matching quincena
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth();
        const year = today.getFullYear();
        
        let targetStart: string;
        if (day >= 6 && day <= 20) {
            targetStart = new Date(year, month, 6).toISOString().split('T')[0];
        } else if (day <= 10) {
            targetStart = new Date(year, month - 1, 21).toISOString().split('T')[0];
        } else {
            targetStart = new Date(year, month, 21).toISOString().split('T')[0];
        }

        return paymentPeriods
            .filter(p => p.estado === PaymentStatus.CALCULATED)
            .filter(p => p.fecha_inicio_periodo === targetStart);
    }, [paymentPeriods, users]);

    const nextPayDate = useMemo(() => {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth();
        const year = today.getFullYear();
        if (day >= 11 && day <= 25) return new Date(year, month, 20);
        if (day <= 10) return new Date(year, month, 5);
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
        <div className="bg-brand-secondary p-4 sm:p-6 rounded-lg shadow-xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl sm:text-4xl font-black text-brand-highlight tracking-tight">Gestión de Nómina</h2>
                    <p className="text-sm text-brand-light opacity-80 font-medium">Calcula, revisa y gestiona los pagos quincenales.</p>
                </div>
                <div className="flex bg-brand-primary p-1 rounded-xl w-full lg:w-auto shadow-inner border border-white/5">
                    <button
                        onClick={() => setShowHistory(false)}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${!showHistory ? 'bg-brand-blue text-white shadow-lg scale-100' : 'text-brand-light hover:text-white'}`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setShowHistory(true)}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${showHistory ? 'bg-brand-blue text-white shadow-lg scale-100' : 'text-brand-light hover:text-white'}`}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {!showHistory ? (
                <>
                    <div className="bg-brand-primary p-6 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-6 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <CurrencyDollarIcon className="w-24 h-24 text-white" />
                        </div>
                        <div className="relative z-10 w-full sm:w-auto text-center sm:text-left">
                            <h4 className="font-black text-xl text-brand-highlight mb-1">Próximo Pago: {nextPayDate.toLocaleDateString()}</h4>
                            <p className="text-brand-light text-sm font-medium">Total calculado a pagar: <span className="font-black text-brand-gold text-lg ml-1">{formatCurrency(totalToPay)}</span></p>
                        </div>
                        <div className="relative z-10 w-full sm:w-auto flex gap-3">
                            <button
                                onClick={handleCalculate}
                                disabled={!!isLoading}
                                className="w-full sm:w-auto bg-brand-blue text-white font-black uppercase text-xs tracking-widest py-4 px-8 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl hover:shadow-brand-blue/20 transition-all active:scale-95"
                            >
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
                                onEditSchedule={(u) => setEditingScheduleUser(u)}
                                onMarkAsPaid={handleMarkSingleAsPaid}
                                onPartialPayment={(p) => setPartialPayPeriod(p)}
                            />
                        })}
                    </div>

                    {editingScheduleUser && (
                        <ScheduleModal
                            user={editingScheduleUser}
                            schedule={userSchedules.find(s => s.user_id === editingScheduleUser.id)}
                            onClose={() => setEditingScheduleUser(null)}
                            onSave={updateUserSchedule}
                        />
                    )}

                    {partialPayPeriod && (
                        <PartialPaymentModal
                            periodId={partialPayPeriod.id}
                            userName={users.find(u => u.id === partialPayPeriod.user_id)?.name || ''}
                            totalAmount={partialPayPeriod.monto_final_a_pagar}
                            paidAmount={partialPayPeriod.monto_pagado_acumulado || 0}
                            onClose={() => setPartialPayPeriod(null)}
                            onSave={(monto) => registrarPagoParcial(partialPayPeriod.id, monto)}
                        />
                    )}

                    {/* ESTADÍSTICAS */}
                    {(showHistory ? paidPeriods : calculatedPeriods).length > 0 && (
                        <div className="mt-12 p-6 bg-brand-primary rounded-xl border border-white/5 shadow-2xl animation-fade-in-up">
                            <h3 className="text-xl font-black text-brand-orange mb-6 flex items-center gap-2 uppercase tracking-widest">
                                <span className="w-2 h-8 bg-brand-orange rounded-full"></span>
                                {showHistory ? 'Resumen Histórico' : 'Estadísticas de Nómina'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Por Empresa */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-brand-blue uppercase tracking-[0.2em] border-b border-white/10 pb-3">Por Empresa</h4>
                                    <div className="space-y-4">
                                        {Object.entries((showHistory ? (
                                            paidPeriods.reduce((acc: Record<string, number>, p) => {
                                                const u = users.find(user => user.id === p.user_id);
                                                const company = u?.company || 'PÚBLICO/SIN EMPRESA';
                                                acc[company] = (acc[company] || 0) + p.monto_final_a_pagar;
                                                return acc;
                                            }, {})
                                        ) : stats.byCompany)).map(([name, total]) => (
                                            <div key={name} className="flex justify-between items-center group">
                                                <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{name}</span>
                                                <span className="font-black text-white text-sm bg-white/5 py-1 px-3 rounded-lg">{formatCurrency(total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Por Área */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-brand-orange uppercase tracking-[0.2em] border-b border-white/10 pb-3">Por Área</h4>
                                    <div className="space-y-4">
                                        {Object.entries((showHistory ? (
                                            paidPeriods.reduce((acc: Record<string, number>, p) => {
                                                const u = users.find(user => user.id === p.user_id);
                                                const area = u?.role || 'SIN ÁREA';
                                                acc[area] = (acc[area] || 0) + p.monto_final_a_pagar;
                                                return acc;
                                            }, {})
                                        ) : stats.byArea)).map(([name, total]) => (
                                            <div key={name} className="flex justify-between items-center group">
                                                <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors capitalize">{name.toLowerCase()}</span>
                                                <span className="font-black text-white text-sm bg-white/5 py-1 px-3 rounded-lg">{formatCurrency(total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <span className="text-sm font-black text-brand-light uppercase tracking-widest opacity-60">
                                    {showHistory ? 'TOTAL PAGADO HISTÓRICO' : 'TOTAL GLOBAL PROYECTADO'}
                                </span>
                                <span className="text-3xl font-black text-brand-gold drop-shadow-[0_0_15px_rgba(255,191,0,0.3)]">
                                    {formatCurrency(showHistory ? paidPeriods.reduce((sum, p) => sum + p.monto_final_a_pagar, 0) : stats.grandTotal)}
                                </span>
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
                                            onEditEvent={onEditEvent} // Pass the real edit callback even in history
                                            onEditSchedule={() => { }} // Added missing prop
                                            onMarkAsPaid={() => { }} // No-op
                                            onPartialPayment={() => { }}
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