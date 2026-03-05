import React, { useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { PaymentPeriod, PayrollEvent, PayrollEventType, PaymentStatus } from '../../../types';
import { ArrowUpIcon, ArrowDownIcon, CalendarIcon, CurrencyDollarIcon, QuestionMarkIcon } from '../../Icons';
import UserTimeline from '../../admin/payroll/UserTimeline';

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

    const eventTypeMap: Record<PayrollEventType, string> = {
        [PayrollEventType.BONUS]: 'Bono',
        [PayrollEventType.OVERTIME]: 'Hora Extra',
        [PayrollEventType.PENALTY]: 'Apercibimiento',
        [PayrollEventType.ABSENCE]: 'Faltó',
        [PayrollEventType.TARDINESS]: 'Tardanza',
        [PayrollEventType.SICK_LEAVE]: 'Enfermedad',
        [PayrollEventType.VACATION]: 'Vacaciones',
        [PayrollEventType.PERMITTED_LEAVE]: 'Licencia',
        [PayrollEventType.EARLY_DEPARTURE]: 'Salida Temprana',
        [PayrollEventType.LOAN]: 'Préstamo'
    };

    const isJustified = event.descripcion.toLowerCase().includes('justificada') || event.descripcion.toLowerCase().includes('aprobada');
    const label = eventTypeMap[event.tipo] || event.tipo;
    const finalLabel = (event.tipo === PayrollEventType.ABSENCE && isJustified) ? 'Falta Justificada' : label;

    const amount = Math.abs(event.monto);

    return (
        <div className="flex justify-between items-center py-2 border-b border-brand-accent/50">
            <div>
                <p className="font-semibold">{finalLabel}</p>
                <p className="text-xs text-brand-light italic">{event.descripcion}</p>
            </div>
            <p className={`font-bold ${isAddition ? 'text-brand-green' : isDeduction ? 'text-brand-red' : 'text-brand-light'}`}>
                {isAddition ? '+' : isDeduction ? '-' : ''}${amount.toLocaleString('es-AR')}
            </p>
        </div>
    );
};

const PaymentPeriodCard: React.FC<{ period: PaymentPeriod, defaultExpanded?: boolean }> = ({ period, defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
        <div className="bg-brand-primary rounded-xl overflow-hidden border border-brand-accent/30 shadow-sm transition-all duration-300">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-5 text-left bg-white hover:bg-brand-secondary transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${period.estado === 'PAGADO' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'}`}>
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-black text-brand-highlight">
                            {period.estado === 'PAGADO' ? 'Pago Recibido' : 'Próxima Liquidación'}
                        </h4>
                        <p className="text-[10px] text-brand-light font-bold uppercase tracking-widest">
                            {new Date(period.fecha_inicio_periodo + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} - {new Date(period.fecha_fin_periodo + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="font-black text-lg text-brand-highlight">${period.monto_final_a_pagar.toLocaleString('es-AR')}</p>
                        <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${period.estado === 'PAGADO' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'}`}>
                            {period.estado === 'PAGADO' ? 'Completado' : 'Pendiente'}
                        </span>
                    </div>
                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ArrowDownIcon className="w-5 h-5 text-brand-light" />
                    </div>
                </div>
            </button>

            {isExpanded && (
                <div className="p-6 border-t border-brand-accent/50 animate-fadeIn bg-white/50">
                    <div className="mb-8">
                        <h5 className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em] mb-4">Cronología del Período</h5>
                        <UserTimeline
                            periodStart={period.fecha_inicio_periodo}
                            periodEnd={period.fecha_fin_periodo}
                            events={period.events}
                        />
                    </div>

                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em]">Desglose de Conceptos</h5>
                        <div className="flex justify-between items-center p-4 bg-brand-secondary/50 rounded-xl border border-brand-accent/30">
                            <span className="font-bold text-brand-highlight">Salario Base Quincenal</span>
                            <span className="font-black text-brand-blue">${period.salario_base_calculado.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="divide-y divide-brand-accent/30">
                            {period.events.length > 0 ? (
                                period.events.map(event => <EventRow key={event.id} event={event} />)
                            ) : (
                                <p className="text-xs text-brand-light italic py-4 text-center">No hubo eventos adicionales en este período.</p>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-brand-accent mt-6 pt-6 space-y-3">
                        <div className="flex justify-between text-sm">
                            <p className="text-brand-green font-bold flex items-center gap-1"><ArrowUpIcon className="w-4 h-4" /> Adiciones</p>
                            <p className="font-black text-brand-green">+${period.total_adiciones.toLocaleString('es-AR')}</p>
                        </div>
                        <div className="flex justify-between text-sm">
                            <p className="text-brand-red font-bold flex items-center gap-1"><ArrowDownIcon className="w-4 h-4" /> Deducciones</p>
                            <p className="font-black text-brand-red">-${Math.abs(period.total_deducciones).toLocaleString('es-AR')}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-brand-accent/50">
                            <p className="text-xs font-black text-brand-light uppercase tracking-widest">Monto Final</p>
                            <p className="text-2xl font-black text-brand-highlight tracking-tight">${period.monto_final_a_pagar.toLocaleString('es-AR')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PaymentsView: React.FC = () => {
    const { currentUser, paymentPeriods, payrollEvents, salaries } = useData();
    const [showHelp, setShowHelp] = React.useState(false);

    const userPaymentPeriods = useMemo(() => {
        if (!currentUser) return [];
        return paymentPeriods.filter(p => p.user_id === currentUser.id)
            .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
    }, [currentUser, paymentPeriods]);

    const nextPayment = userPaymentPeriods.find(p => p.estado === PaymentStatus.CALCULATED);
    const pastPayments = userPaymentPeriods.filter(p => p.estado === PaymentStatus.PAID);

    // Lógica para generar la vista previa en tiempo real
    const previewPeriod = useMemo(() => {
        if (nextPayment || !currentUser) return null;

        const today = new Date();
        const day = today.getDate();
        const year = today.getFullYear();
        const month = today.getMonth();
        let start: Date, end: Date;

        if (day <= 5) { start = new Date(year, month - 1, 21); end = new Date(year, month, 5); }
        else if (day <= 20) { start = new Date(year, month, 6); end = new Date(year, month, 20); }
        else { start = new Date(year, month, 21); end = new Date(year, month + 1, 5); }

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // Filtrar eventos que caen en este periodo y no están asociados a una liquidación cerrada
        const currentEvents = payrollEvents.filter(e =>
            e.user_id === currentUser.id &&
            e.fecha_evento >= startStr &&
            e.fecha_evento <= endStr &&
            !e.periodo_pago_id
        );

        const salary = salaries.find(s => s.user_id === currentUser.id)?.monto_base_quincenal || 0;
        const additions = currentEvents.filter(e => e.monto > 0).reduce((acc, e) => acc + e.monto, 0);
        const deductions = currentEvents.filter(e => e.monto < 0).reduce((acc, e) => acc + e.monto, 0);

        return {
            id: 'preview',
            user_id: currentUser.id,
            fecha_inicio_periodo: startStr,
            fecha_fin_periodo: endStr,
            fecha_pago: endStr,
            salario_base_calculado: salary,
            total_adiciones: additions,
            total_deducciones: deductions,
            monto_final_a_pagar: salary + additions + deductions,
            estado: 'VISTA PREVIA' as any,
            created_at: new Date().toISOString(),
            events: currentEvents
        } as PaymentPeriod;
    }, [nextPayment, currentUser, payrollEvents, salaries]);

    if (!currentUser) return null;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col items-center text-center space-y-1 mb-6">
                <div className="w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/20">
                    <CurrencyDollarIcon className="w-8 h-8" />
                </div>
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-brand-highlight tracking-tight">Centro de Pagos</h2>
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className={`p-1 rounded-full transition-colors ${showHelp ? 'bg-brand-blue/10 text-brand-blue' : 'text-brand-light hover:bg-brand-accent'}`}
                        title="Mostrar ayuda"
                    >
                        <QuestionMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                {showHelp && (
                    <p className="text-[11px] text-brand-light max-w-sm animate-fadeIn bg-brand-accent/20 p-2 rounded-lg border border-brand-accent/30">
                        Consulta tu historial de haberes, premios y deducciones en tiempo real.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-10">
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 bg-brand-blue rounded-full"></div>
                        <h3 className="text-lg font-black text-brand-highlight uppercase tracking-tight">Liquidación en Curso</h3>
                    </div>
                    {nextPayment ? (
                        <PaymentPeriodCard period={nextPayment} defaultExpanded={true} />
                    ) : previewPeriod ? (
                        <div className="space-y-4">
                            <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl p-4 flex items-start gap-3">
                                <div className="text-brand-blue mt-0.5">
                                    <ArrowUpIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-brand-blue uppercase tracking-widest">Vista Previa Activa</p>
                                    <p className="text-[11px] text-brand-light font-bold">Estos valores son provisorios y se actualizarán hasta el cierre de la quincena.</p>
                                </div>
                            </div>
                            <PaymentPeriodCard period={previewPeriod} defaultExpanded={true} />
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-brand-accent/50 p-12 rounded-[32px] text-center">
                            <p className="text-brand-light font-bold italic">No hay datos para la quincena actual todavía.</p>
                        </div>
                    )}
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 bg-brand-highlight rounded-full"></div>
                        <h3 className="text-lg font-black text-brand-highlight uppercase tracking-tight">Historial de Pagos</h3>
                    </div>
                    {pastPayments.length > 0 ? (
                        <div className="space-y-4">
                            {pastPayments.map(period => <PaymentPeriodCard key={period.id} period={period} />)}
                        </div>
                    ) : (
                        <div className="bg-white/50 border border-brand-accent p-12 rounded-[32px] text-center">
                            <p className="text-brand-light font-bold italic">Tu historial de pagos comenzará a aparecer aquí.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default PaymentsView;