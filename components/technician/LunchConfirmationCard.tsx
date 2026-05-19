import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { UtensilsIcon, XIcon } from '../Icons';

const TIMEOUT_SECONDS = 10;

interface LunchConfirmationCardProps {
    userId: string;
}

const LunchConfirmationCard: React.FC<LunchConfirmationCardProps> = ({ userId }) => {
    const [status, setStatus] = useState<'loading' | 'pending' | 'confirmed' | 'declined' | 'dismissed'>('loading');
    const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
    const [saving, setSaving] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const timerRef = useRef<number | undefined>(undefined);
    const today = new Date().toISOString().split('T')[0];

    // Check if already answered today
    useEffect(() => {
        api.getUserLunchConfirmation(userId, today)
            .then((conf: any) => {
                if (conf) {
                    setStatus(conf.confirmed ? 'confirmed' : 'declined');
                } else {
                    setStatus('pending');
                }
            })
            .catch(() => setStatus('dismissed'));
    }, [userId, today]);

    // Countdown — only runs while pending
    useEffect(() => {
        if (status !== 'pending') return;
        timerRef.current = window.setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) {
                    clearInterval(timerRef.current);
                    setStatus('dismissed');
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [status]);

    const handleConfirm = async (confirmed: boolean) => {
        clearInterval(timerRef.current);
        setSaving(true);
        try {
            await api.confirmLunch(userId, today, confirmed);
            setStatus(confirmed ? 'confirmed' : 'declined');
            setShowResult(true);
            setTimeout(() => setShowResult(false), 2500);
        } catch {
            alert('Error al guardar tu elección.');
        } finally {
            setSaving(false);
        }
    };

    const progress = (secondsLeft / TIMEOUT_SECONDS) * 100;

    // Don't render anything if loading, already dismissed, or result toast expired
    if (status === 'loading' || status === 'dismissed') return null;
    if ((status === 'confirmed' || status === 'declined') && !showResult) return null;

    // Brief confirmation toast after answering
    if ((status === 'confirmed' || status === 'declined') && showResult) {
        return (
            <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
                <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-white font-bold text-sm
                    ${status === 'confirmed' ? 'bg-green-500 border-green-400' : 'bg-slate-600 border-slate-500'}`}>
                    <UtensilsIcon className="w-5 h-5 flex-shrink-0" />
                    {status === 'confirmed' ? '¡Anotado! Buen provecho 🍽️' : 'Entendido, hoy no comes.'}
                </div>
            </div>
        );
    }

    // Main pending popup
    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 animate-fadeIn">
            <div className="bg-gradient-to-br from-brand-blue to-brand-highlight rounded-3xl shadow-2xl overflow-hidden">
                {/* Countdown bar */}
                <div className="h-1 bg-white/20">
                    <div
                        className="h-full bg-white/70 transition-all duration-1000 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="p-5 relative">
                    {/* Dismiss button */}
                    <button
                        onClick={() => { clearInterval(timerRef.current); setStatus('dismissed'); }}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2 mb-1">
                        <UtensilsIcon className="w-4 h-4 text-white" />
                        <span className="text-white font-black text-sm uppercase tracking-wider">¿Comes hoy con nosotros?</span>
                    </div>
                    <p className="text-white/70 text-xs font-semibold mb-4">
                        Queremos saber cuánta comida preparar.
                        <span className="ml-1 text-white/50">({secondsLeft}s)</span>
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={() => handleConfirm(true)}
                            disabled={saving}
                            className="flex-1 bg-white text-brand-blue font-black py-2.5 text-sm rounded-xl shadow transition-all active:scale-95 disabled:opacity-50 hover:scale-[1.02]"
                        >
                            SÍ, CLARO
                        </button>
                        <button
                            onClick={() => handleConfirm(false)}
                            disabled={saving}
                            className="flex-1 bg-white/15 backdrop-blur text-white border border-white/20 font-black py-2.5 text-sm rounded-xl transition-all active:scale-95 disabled:opacity-50 hover:bg-white/25"
                        >
                            HOY NO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LunchConfirmationCard;
