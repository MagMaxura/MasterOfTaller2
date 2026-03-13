import React, { useState } from 'react';

interface PartialPaymentModalProps {
    periodId: string;
    userName: string;
    totalAmount: number;
    paidAmount: number;
    onClose: () => void;
    onSave: (monto: number) => Promise<void>;
}

const PartialPaymentModal: React.FC<PartialPaymentModalProps> = ({ 
    periodId, 
    userName, 
    totalAmount, 
    paidAmount, 
    onClose, 
    onSave 
}) => {
    const [monto, setMonto] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);

    const remaining = totalAmount - paidAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (monto <= 0) return;
        
        setIsLoading(true);
        try {
            await onSave(monto);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <form onSubmit={handleSubmit} className="bg-brand-secondary rounded-2xl max-w-md w-full p-8 relative border border-white/10 shadow-2xl">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-brand-light hover:text-white text-2xl transition-colors"
                >
                    &times;
                </button>
                
                <h3 className="text-2xl font-black text-white mb-2">Registrar Pago Parcial</h3>
                <p className="text-brand-light mb-6 font-medium">para <span className="text-white">{userName}</span></p>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-brand-primary/50 p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-brand-light font-black mb-1">Total Período</p>
                            <p className="text-lg font-black text-white">${totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-brand-primary/50 p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-brand-light font-black mb-1">Pagado hasta ahora</p>
                            <p className="text-lg font-black text-brand-green">${paidAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-brand-orange/10 p-4 rounded-xl border border-brand-orange/20">
                        <p className="text-[10px] uppercase tracking-widest text-brand-orange font-black mb-1">Saldo Pendiente</p>
                        <p className="text-2xl font-black text-brand-orange">${remaining.toLocaleString()}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-brand-light mb-2">Monto a pagar ahora</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold font-black text-xl">$</span>
                            <input 
                                type="number" 
                                value={monto || ''} 
                                onChange={e => setMonto(parseFloat(e.target.value))} 
                                className="w-full bg-brand-primary p-4 pl-10 rounded-xl border-2 border-brand-accent focus:border-brand-gold outline-none text-xl font-black text-white transition-all shadow-inner"
                                placeholder="0.00"
                                required
                                autoFocus
                                max={remaining}
                                step="any"
                            />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button 
                                type="button"
                                onClick={() => setMonto(remaining / 2)}
                                className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-brand-light transition-all"
                            >
                                50% Saldo
                            </button>
                            <button 
                                type="button"
                                onClick={() => setMonto(remaining)}
                                className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-brand-light transition-all"
                            >
                                Liquidar Saldo
                            </button>
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading || monto <= 0} 
                    className="w-full mt-8 bg-brand-blue text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl hover:shadow-brand-blue/20 transition-all active:scale-95"
                >
                    {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                    Confirmar Pago
                </button>
            </form>
        </div>
    );
};

export default PartialPaymentModal;
