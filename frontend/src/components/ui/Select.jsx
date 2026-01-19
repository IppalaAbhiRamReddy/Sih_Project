import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export function Select({ label, value, onChange, options, placeholder = "Select option", className }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`space-y-1.5 ${className}`} ref={containerRef}>
            {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}

            <div className="relative">
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full h-11 px-4 flex items-center justify-between rounded-lg border transition-all text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${isOpen
                            ? 'border-blue-500 ring-2 ring-blue-100 bg-white'
                            : 'border-gray-200 bg-gray-50 hover:bg-white'
                        } ${!value ? 'text-gray-500' : 'text-gray-900'}`}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 max-h-60 overflow-auto animate-fade-in">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${value === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                    }`}
                            >
                                {option.label}
                                {value === option.value && <Check className="w-4 h-4 text-blue-600" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
