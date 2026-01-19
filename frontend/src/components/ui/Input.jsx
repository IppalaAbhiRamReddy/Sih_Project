import React from 'react';

export function Input({ label, className, ...props }) {
    return (
        <div className="space-y-1.5">
            {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
            <input
                className={`w-full h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all ${className}`}
                {...props}
            />
        </div>
    );
}
