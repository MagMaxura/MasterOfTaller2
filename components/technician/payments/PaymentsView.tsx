import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useData } from '../../../contexts/DataContext';

const PaymentsView: React.FC = () => {
    const { currentUser } = useAuth();

    if (!currentUser) return null;

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold mb-4 text-center">Mis Pagos</h2>
            <p className="text-center text-brand-light mb-8 max-w-2xl mx-auto">
                Consulta el estado de tu próximo pago y tu historial de quincenas.
            </p>
            <div className="bg-brand-primary rounded-lg p-8 text-center">
                <p className="text-brand-light">Funcionalidad en desarrollo...</p>
            </div>
        </div>
    );
};

export default PaymentsView;
