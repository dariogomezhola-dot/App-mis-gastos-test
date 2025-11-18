
import React from 'react';

interface BadgeProps {
    text: string;
    color: 'green' | 'red' | 'blue' | 'yellow';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ text, color, className = '' }) => {
    const colorClasses = {
        green: 'bg-green-500/20 text-green-400 border border-green-500/30',
        red: 'bg-red-500/20 text-red-400 border border-red-500/30',
        blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        yellow: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    };

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[color]} ${className}`}>
            {text}
        </span>
    );
};
