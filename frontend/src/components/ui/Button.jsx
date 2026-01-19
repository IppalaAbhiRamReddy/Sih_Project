import React from 'react';

export function Button({ children, className, ...props }) {
    return (
        <button
            className={`w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:ring-4 focus:ring-blue-100 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
