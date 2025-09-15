import React from 'react';

const LoadingSpinner: React.FC<{message?: string}> = ({message = "Cargando Aplicación..."}) => (
    <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 border-4 border-t-transparent border-brand-blue rounded-full animate-spin"></div>
        <p className="text-brand-highlight mt-4 text-lg">{message}</p>
    </div>
);

export default LoadingSpinner;
