import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UtensilsIcon, CheckIcon, XIcon } from '../Icons';

interface LunchConfirmationCardProps {
    userId: string;
}

const LunchConfirmationCard: React.FC<LunchConfirmationCardProps> = ({ userId }) => {
    const [status, setStatus] = useState<'pending' | 'confirmed' | 'declined'>('pending');
    const [loading, setLoading] = useState(true);
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const conf = await api.getUserLunchConfirmation(userId, today) as any;
                if (conf) {
                    setStatus(conf.confirmed ? 'confirmed' : 'declined');
                }
            } catch (error) {
                console.error('Error checking lunch status:', error);
            } finally {
                setLoading(false);
            }
        };
        checkStatus();
    }, [userId, today]);

    const handleConfirm = async (confirmed: boolean) => {
        setLoading(true);
        try {
            await api.confirmLunch(userId, today, confirmed);
            setStatus(confirmed ? 'confirmed' : 'declined');
        } catch (error) {
            console.error('Error confirming lunch:', error);
            alert('Error al guardar tu elección.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && status === 'pending') return null;

    if (status !== 'pending') {
        return (
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-premium border border-brand-accent/30 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${status === 'confirmed' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        {status === 'confirmed' ? <UtensilsIcon className="w-5 h-5" /> : <XIcon className="w-5 h-5" />}
                    </div>
                    <div>
                        <span className="block font-black text-xs uppercase tracking-widest text-brand-light">Almuerzo de Hoy</span>
                        <span className="block font-bold text-brand-secondary">
                            {status === 'confirmed' ? '¡Confirmado! Buen provecho.' : 'Hoy no comes en el taller.'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setStatus('pending')}
                    className="text-[10px] font-black uppercase text-brand-blue hover:underline"
                >
                    Cambiar
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-brand-blue to-brand-highlight p-6 rounded-3xl text-white shadow-xl relative overflow-hidden animate-bounce-subtle">
            <UtensilsIcon className="absolute -right-2 -bottom-2 w-24 h-24 opacity-10 rotate-12" />

            <div className="relative z-10">
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <UtensilsIcon className="w-5 h-5" />
                    ¿Comes hoy con nosotros?
                </h3>
                <p className="text-white/80 text-sm font-bold mt-1">Queremos saber cuánta comida preparar hoy.</p>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={() => handleConfirm(true)}
                        disabled={loading}
                        className="flex-1 bg-white text-brand-blue font-black py-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        SÍ, CLARO
                    </button>
                    <button
                        onClick={() => handleConfirm(false)}
                        disabled={loading}
                        className="flex-1 bg-brand-blue/30 backdrop-blur-md text-white border border-white/20 font-black py-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        HOY NO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LunchConfirmationCard;
