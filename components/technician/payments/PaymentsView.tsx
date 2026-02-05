import React, { useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { PaymentPeriod, PayrollEvent, PayrollEventType } from '../../../types';
import { ArrowUpIcon, ArrowDownIcon } from '../../Icons';
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
        [PayrollEventType.ABSENCE]: 'Falta',
        [PayrollEventType.TARDINESS]: 'Tardanza',
        [PayrollEventType.SICK_LEAVE]: 'Enfermedad',
        [PayrollEventType.VACATION]: 'Vacaciones',
        [PayrollEventType.PERMITTED_LEAVE]: 'Licencia',
        [PayrollEventType.EARLY_DEPARTURE]: 'Salida Temprana',
        [PayrollEventType.LOAN]: 'Préstamo'
    };

    const amount = Math.abs(event.monto);

    return (
        <div className="flex justify-between items-center py-2 border-b border-brand-accent/50">
            <div>
                <p className="font-semibold">{eventTypeMap[event.tipo] || event.tipo}</p>
                <p className="text-xs text-brand-light italic">{event.descripcion}</p>
            </div>
            <p className={`font-bold ${isAddition ? 'text-brand-green' : isDeduction ? 'text-brand-red' : 'text-brand-light'}`}>
                {isAddition ? '+' : isDeduction ? '-' : ''}${amount.toLocaleString('es-AR')}
            </p>
        </div>
    );
};

const PaymentPeriodCard: React.FC<{ period: PaymentPeriod }> = ({ period }) => {
    return (
        <div className="bg-brand-primary p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h4 className="text-lg font-bold">Pago del {new Date(period.fecha_pago + 'T00:00:00').toLocaleDateString()}</h4>
                    <p className="text-xs text-brand-light">Período: {new Date(period.fecha_inicio_periodo + 'T00:00:00').toLocaleDateString()} - {new Date(period.fecha_fin_periodo + 'T00:00:00').toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${period.estado === 'PAGADO' ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-orange/20 text-brand-orange'}`}>
                    {period.estado}
                </span>
            </div>

            <div className="mb-6">
                <UserTimeline
                    periodStart={period.fecha_inicio_periodo}
                    periodEnd={period.fecha_fin_periodo}
                    events={period.events}
                />
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-brand-secondary rounded-lg">
                    <p>Salario Base</p>
                    <p className="font-bold">${period.salario_base_calculado.toLocaleString('es-AR')}</p>
                </div>
                {period.events.map(event => <EventRow key={event.id} event={event} />)}
            </div>

            <div className="border-t border-brand-accent mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <p className="text-brand-green flex items-center gap-1"><ArrowUpIcon className="w-4 h-4" /> Total Adiciones</p>
                    <p className="font-semibold text-brand-green">+${period.total_adiciones.toLocaleString('es-AR')}</p>
                </div>
                <div className="flex justify-between text-sm">
                    <p className="text-brand-red flex items-center gap-1"><ArrowDownIcon className="w-4 h-4" /> Total Deducciones</p>
                    <p className="font-semibold text-brand-red">-${Math.abs(period.total_deducciones).toLocaleString('es-AR')}</p>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2">
                    <p>TOTAL A PAGAR</p>
                    <p>${period.monto_final_a_pagar.toLocaleString('es-AR')}</p>
                </div>
            </div>
        </div>
    );
};

const PaymentsView: React.FC = () => {
    const { currentUser, paymentPeriods } = useData();

    const userPaymentPeriods = useMemo(() => {
        if (!currentUser) return [];
        return paymentPeriods.filter(p => p.user_id === currentUser.id)
            .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
    }, [currentUser, paymentPeriods]);

    const nextPayment = userPaymentPeriods.find(p => p.estado === 'CALCULADO');
    const pastPayments = userPaymentPeriods.filter(p => p.estado === 'PAGADO');

    if (!currentUser) return null;

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-xl max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-center">Mis Pagos</h2>
            <p className="text-center text-brand-light mb-8 max-w-2xl mx-auto">
                Consulta el estado de tu próximo pago y tu historial de quincenas.
            </p>

            <div className="space-y-8">
                <div>
                    <h3 className="text-2xl font-bold mb-4">Próximo Pago</h3>
                    {nextPayment ? (
                        <PaymentPeriodCard period={nextPayment} />
                    ) : (
                        <div className="bg-brand-primary p-8 rounded-lg text-center text-brand-light italic">
                            Tu próximo pago aún no ha sido calculado.
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-2xl font-bold mb-4">Historial de Pagos</h3>
                    {pastPayments.length > 0 ? (
                        <div className="space-y-6">
                            {pastPayments.map(period => <PaymentPeriodCard key={period.id} period={period} />)}
                        </div>
                    ) : (
                        <div className="bg-brand-primary p-8 rounded-lg text-center text-brand-light italic">
                            No tienes pagos anteriores registrados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentsView;