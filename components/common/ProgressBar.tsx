import React from 'react';

const ProgressBar: React.FC<{ value: number; max: number; colorClass: string }> = ({ value, max, colorClass }) => (
    <div className="w-full bg-brand-accent rounded-full h-2.5">
        <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${(value / max) * 100}%` }}></div>
    </div>
);

export default ProgressBar;
