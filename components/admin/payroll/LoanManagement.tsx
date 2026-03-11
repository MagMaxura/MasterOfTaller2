import React, { useState, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { User, PayrollEventType, PayrollEvent } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import { CurrencyDollarIcon, UserIcon, CalendarIcon } from '../../Icons';

const getNextQuincenaDate = (date: Date): Date => {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    if (day <= 5) return new Date(year, month, 5);
    if (day <= 20) return new Date(year, month, 20);
    return new Date(year, month + 1, 5);
};

const LoanManagement: React.FC = () => {
    const { users, payrollEvents, addPayrollEvent, calculatePayPeriods } = useData();
    const { showToast } = useToast();

    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [loanAmount, setLoanAmount] = useState<number | ''>('');
    const [loanDate, setLoanDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState<string>('Préstamo personal');
    const [isLoading, setIsLoading] = useState(false);

    const usersSorted = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);

    // Calculate details dynamically
    const { daysUntilQuincena, interestAmount, totalAmount, quincenaDate } = useMemo(() => {
        if (!loanDate || !loanAmount) return { daysUntilQuincena: 0, interestAmount: 0, totalAmount: 0, quincenaDate: null };
        const dateObj = new Date(loanDate + 'T00:00:00');
        const nextQ = getNextQuincenaDate(dateObj);

        // Ensure we don't count negative days if the user chooses a future nextQ improperly, 
        // though our logic sets nextQ >= loanDate implicitly by the day rules
        const diffTime = Math.abs(nextQ.getTime() - dateObj.getTime());
        const _days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const amount = Number(loanAmount);
        const interest = amount * 0.02 * _days;

        return {
            daysUntilQuincena: _days,
            interestAmount: interest,
            totalAmount: amount + interest,
            quincenaDate: nextQ
        };
    }, [loanDate, loanAmount]);

    const handleRegisterLoan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !loanAmount || !loanDate) {
            showToast('Por favor, completa todos los campos obligatorios.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await addPayrollEvent({
                user_id: selectedUserId,
                tipo: PayrollEventType.LOAN,
                monto: totalAmount, // The total amount to deduct
                descripcion: `${description} (Capital: $${loanAmount}, Interés 2%/día x ${daysUntilQuincena} días: $${interestAmount})`,
                fecha_evento: loanDate,
            });

            try {
                await calculatePayPeriods();
            } catch (calcError) {
                console.error("Auto-recalculation failed:", calcError);
            }

            showToast('Préstamo registrado exitosamente.', 'success');
            setLoanAmount('');
            setDescription('Préstamo personal');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error al registrar el préstamo.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Recent loans view
    const recentLoans = useMemo(() => {
        return payrollEvents
            .filter(e => e.tipo === PayrollEventType.LOAN)
            .sort((a, b) => new Date(b.created_at || b.fecha_evento).getTime() - new Date(a.created_at || a.fecha_evento).getTime())
            .slice(0, 10);
    }, [payrollEvents]);

    return (
        <div className="bg-brand-secondary p-4 sm:p-6 rounded-lg shadow-xl">
            <div className="mb-8 space-y-1">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Módulo de Préstamos</h2>
                <p className="text-sm text-brand-light opacity-80 font-medium">Registra préstamos al personal con cálculo automático de intereses hasta la quincena.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-brand-primary p-6 rounded-2xl border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <CurrencyDollarIcon className="w-6 h-6 text-brand-blue" />
                        Nuevo Préstamo
                    </h3>

                    <form onSubmit={handleRegisterLoan} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-light mb-1">Empleado</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-light opacity-50" />
                                <select
                                    value={selectedUserId}
                                    onChange={e => setSelectedUserId(e.target.value)}
                                    className="w-full bg-brand-secondary/50 p-3 pl-10 rounded-lg border border-brand-accent focus:border-brand-blue transition-colors text-white"
                                    required
                                >
                                    <option value="" disabled>Selecciona un empleado...</option>
                                    {usersSorted.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">Monto Solicitado ($)</label>
                                <input
                                    type="number"
                                    value={loanAmount}
                                    onChange={e => setLoanAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    placeholder="Ej: 15000"
                                    className="w-full bg-brand-secondary/50 p-3 rounded-lg border border-brand-accent focus:border-brand-blue transition-colors text-white"
                                    required
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">Fecha del Préstamo</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-light opacity-50" />
                                    <input
                                        type="date"
                                        value={loanDate}
                                        onChange={e => setLoanDate(e.target.value)}
                                        className="w-full bg-brand-secondary/50 p-3 pl-10 rounded-lg border border-brand-accent focus:border-brand-blue transition-colors text-white"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-light mb-1">Concepto</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ej: Adelanto para emergencia"
                                className="w-full bg-brand-secondary/50 p-3 rounded-lg border border-brand-accent focus:border-brand-blue transition-colors text-white"
                                required
                            />
                        </div>

                        {/* Summary Box */}
                        {(loanAmount && loanDate) ? (
                            <div className="mt-6 bg-brand-blue/10 border border-brand-blue/30 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-brand-light">Días hasta quincena ({quincenaDate?.toLocaleDateString()}):</span>
                                    <span className="font-bold text-white">{daysUntilQuincena} días</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-brand-light">Interés (2% diario x {daysUntilQuincena}):</span>
                                    <span className="font-bold text-brand-orange">${interestAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="pt-2 border-t border-brand-blue/20 flex justify-between items-center">
                                    <span className="font-bold text-white">Total a Descontar:</span>
                                    <span className="text-2xl font-black text-brand-gold">${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-6 bg-brand-blue text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                            ) : (
                                <CurrencyDollarIcon className="w-5 h-5" />
                            )}
                            Registrar Préstamo
                        </button>
                    </form>
                </div>

                {/* Recent Loans History */}
                <div className="bg-brand-primary p-6 rounded-2xl border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-brand-blue" />
                        Últimos Préstamos Registrados
                    </h3>

                    {recentLoans.length === 0 ? (
                        <p className="text-brand-light italic text-center py-8 opacity-70">No hay préstamos recientes.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentLoans.map(loan => {
                                const u = users.find(user => user.id === loan.user_id);
                                return (
                                    <div key={loan.id} className="bg-brand-secondary/30 p-3 rounded-lg border border-brand-accent/30 flex justify-between items-center hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {u ? (
                                                <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full border border-white/10" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-brand-accent/50 flex items-center justify-center">?</div>
                                            )}
                                            <div>
                                                <p className="font-bold text-white text-sm">{u ? u.name : 'Usuario Desconocido'}</p>
                                                <p className="text-xs text-brand-light opacity-80">{new Date(loan.fecha_evento + 'T00:00:00').toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-brand-red">-${loan.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                                            <p className="text-[10px] text-brand-light truncate max-w-[120px]" title={loan.descripcion}>{loan.descripcion}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoanManagement;
