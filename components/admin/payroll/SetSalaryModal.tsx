import React, { useState, useEffect } from 'react';
import { User, Salary } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';

interface SetSalaryModalProps {
    user: User;
    onClose: () => void;
}

const SetSalaryModal: React.FC<SetSalaryModalProps> = ({ user, onClose }) => {
    const { salaries, setSalary } = useData();
    const { showToast } = useToast();
    const [amount, setAmount] = useState<number | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    
    const existingSalary = salaries.find(s => s.user_id === user.id);

    useEffect(() => {
        if (existingSalary) {
            setAmount(existingSalary.monto_base_quincenal);
        }
    }, [existingSalary]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount === '' || amount <= 0) {
            showToast('Por favor, introduce un monto válido.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await setSalary(user.id, amount, existingSalary?.id);
            showToast(`Salario de ${user.name} actualizado.`, 'success');
            onClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error al guardar el salario.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-brand-secondary rounded-lg max-w-md w-full p-6 relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white text-3xl">&times;</button>
                <h3 className="text-2xl font-bold mb-2">Definir Salario</h3>
                <p className="text-brand-light mb-6">para {user.name}</p>
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-brand-light">Monto Base Quincenal ($)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Ej: 50000"
                        className="w-full bg-brand-primary p-3 rounded border border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        required
                        min="0"
                    />
                </div>
                <button type="submit" disabled={isLoading} className="w-full mt-6 bg-brand-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-brand-accent">
                    {isLoading && <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                    {isLoading ? 'Guardando...' : 'Guardar Salario'}
                </button>
            </form>
        </div>
    );
};

export default SetSalaryModal;
