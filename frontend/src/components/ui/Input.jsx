import React from "react";

export const Input = ({
    label,
    id,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    ...props
}) => {
    return (
        <div className="space-y-2">
            {label && (
                <label
                    htmlFor={id}
                    className="text-sm font-semibold text-gray-700"
                >
                    {label}
                </label>
            )}

            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                {...props}
                className="
          w-full rounded-md border border-gray-300
          px-3 py-2 text-sm text-gray-900
          placeholder:text-gray-400
          bg-white
          transition-shadow outline-none
          focus:ring-2 focus:ring-blue-100
          focus:border-blue-500
          disabled:pointer-events-none disabled:opacity-50
        "
            />
        </div>
    );
};
