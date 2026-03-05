import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { ChefIcon, UtensilsIcon, CheckIcon, BellIcon } from '../Icons';
import LoadingSpinner from '../common/LoadingSpinner';

const KitchenManagement: React.FC = () => {
    const { users } = useData();
    const [confirmations, setConfirmations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNotifying, setIsNotifying] = useState(false);
    const today = new Date().toISOString().split('T')[0];

    const fetchConfirmations = async () => {
        try {
            const data = await api.getDailyLunchConfirmations(today);
            setConfirmations(data);
        } catch (error) {
            console.error('Error fetching confirmations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfirmations();
        const interval = setInterval(fetchConfirmations, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, []);

    const handleNotifyDiners = async () => {
        setIsNotifying(true);
        try {
            // Get all diners (users with 'comensal' badge)
            // For now, we'll notify all active users as a proxy if we don't have a strict list
            const diners = users.filter((u: any) => u.is_active);

            await Promise.all(diners.map(d =>
                api.sendNotification(
                    d.id,
                    "🍴 ¿Comes hoy con nosotros?",
                    "El cocinero está organizando el almuerzo. ¡Confirma tu asistencia en el panel!"
                )
            ));
            alert('Pregunta enviada a todos los comensales.');
        } catch (error) {
            console.error('Error notifying diners:', error);
            alert('Hubo un error al enviar las notificaciones.');
        } finally {
            setIsNotifying(false);
        }
    };

    if (loading) return <LoadingSpinner message="Cargando pedidos de hoy..." />;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-gradient-to-br from-brand-blue to-brand-highlight p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <ChefIcon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                    <ChefIcon className="w-8 h-8" />
                    Gestión de Cocina
                </h2>
                <p className="text-white/80 font-bold mt-1">Recuento de platos para hoy: {today}</p>

                <div className="mt-8 flex gap-8">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex-1 border border-white/20">
                        <span className="block text-3xl font-black">{confirmations.length}</span>
                        <span className="text-[10px] uppercase font-black opacity-80">Platos Confirmados</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-premium border border-brand-accent/30 overflow-hidden relative">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-brand-secondary">
                            <UtensilsIcon className="w-5 h-5 text-brand-blue" />
                            Comensales ({confirmations.length})
                        </h3>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                        {confirmations.length === 0 ? (
                            <div className="text-center py-8 text-brand-light font-bold italic">
                                Aún no hay confirmaciones para hoy.
                            </div>
                        ) : (
                            confirmations.map((conf) => (
                                <div key={conf.id} className="flex items-center gap-3 p-3 bg-brand-secondary/5 rounded-2xl border border-brand-accent/20">
                                    <img
                                        src={conf.profiles?.avatar || `https://ui-avatars.com/api/?name=${conf.profiles?.name}&background=random`}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover border-2 border-brand-blue/30"
                                    />
                                    <div className="flex-1">
                                        <span className="block font-black text-sm text-brand-secondary truncate">{conf.profiles?.name}</span>
                                        <span className="text-[10px] font-bold text-gray-400">Confirmado a las {new Date(conf.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="bg-green-500/10 text-green-600 p-2 rounded-xl">
                                        <CheckIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleNotifyDiners}
                        disabled={isNotifying}
                        className="w-full bg-brand-yellow hover:bg-yellow-500 text-black font-black py-4 rounded-3xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        <BellIcon className={`w-6 h-6 ${isNotifying ? 'animate-bounce' : ''}`} />
                        {isNotifying ? 'ENVIANDO...' : 'PREGUNTAR QUIÉN COME HOY'}
                    </button>

                    <div className="bg-brand-blue/5 border border-brand-blue/20 p-6 rounded-3xl">
                        <h4 className="font-black text-brand-blue uppercase text-xs mb-2 tracking-widest">Información</h4>
                        <p className="text-sm text-brand-secondary/80 font-bold leading-relaxed">
                            Asegúrate de enviar la notificación solo cuando la comida esté servida y lista para todos.
                            El recuento se resetea automáticamente a las 00:00 cada día.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KitchenManagement;
