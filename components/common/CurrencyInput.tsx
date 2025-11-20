
import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, placeholder, className = '', autoFocus }) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // Initialize display value from prop
        if (value === 0 && displayValue === '') return;
        setDisplayValue(new Intl.NumberFormat('es-CO').format(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '').replace(/\D/g, '');
        
        if (rawValue === '') {
            setDisplayValue('');
            onChange(0);
            return;
        }

        const numberValue = parseInt(rawValue, 10);
        
        if (!isNaN(numberValue)) {
            const formatted = new Intl.NumberFormat('es-CO').format(numberValue);
            setDisplayValue(formatted);
            onChange(numberValue);
        }
    };

    return (
        <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
            autoFocus={autoFocus}
        />
    );
};
