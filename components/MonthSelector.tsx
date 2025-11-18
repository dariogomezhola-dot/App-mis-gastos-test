import React from 'react';

interface MonthSelectorProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ currentDate, setCurrentDate }) => {
    
    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
    const year = currentDate.getFullYear();

    return (
        <div className="flex items-center justify-center bg-gray-700 rounded-lg p-2 space-x-4">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-gray-600 transition-colors">
                &lt;
            </button>
            <span className="font-bold text-lg text-white w-32 text-center capitalize">{monthName} {year}</span>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-gray-600 transition-colors">
                &gt;
            </button>
        </div>
    );
};
