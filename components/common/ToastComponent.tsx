import React, { useEffect } from 'react';
import { Toast } from '../../types';

const ToastComponent: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colors = {
    success: 'bg-brand-green border-green-500',
    error: 'bg-brand-red border-red-500',
    info: 'bg-brand-blue border-blue-500',
  };

  return (
    <div className={`w-full max-w-sm p-4 text-white rounded-lg shadow-lg ${colors[toast.type]} border-l-4 animate-fade-in-right`}>
      <div className="flex items-start">
        <div className="flex-1">
          <p className="font-bold">{toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}</p>
          <p className="text-sm">{toast.message}</p>
        </div>
        <button onClick={onDismiss} className="ml-4 text-xl font-bold leading-none">&times;</button>
      </div>
    </div>
  );
};

export default ToastComponent;
