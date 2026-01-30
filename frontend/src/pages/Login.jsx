import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, ChevronDown } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Login() {
    const navigate = useNavigate();
    const [role, setRole] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const roles = [
        { id: 'admin', label: 'Admin' },
        { id: 'hospital', label: 'Hospital Authority' },
        { id: 'staff', label: 'Staff' },
        { id: 'doctor', label: 'Doctor' },
        { id: 'patient', label: 'Patient' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (role) {
            console.log('Logging in as:', role, formData);
            navigate(`/${role}`);
        } else {
            alert("Please select a role for this demo.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-8">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-md hover:bg-gray-100 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            Login
                        </h1>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="email"
                        label="Email / ID"
                        placeholder="Enter your email or ID"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        required
                    />

                    <Input
                        id="password"
                        type="password"
                        label="Password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                        }
                        required
                    />

                    {/* Role Dropdown */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                            Login As (Demo)
                        </label>

                        <div className="relative">
                            <button
                                type="button"
                                role="combobox"
                                aria-expanded={dropdownOpen}
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="
                  flex w-full items-center justify-between gap-2
                  rounded-md border border-gray-300
                  bg-white px-3 py-2 text-sm text-gray-700
                  transition-shadow outline-none
                  focus:ring-2 focus:ring-blue-100
                  focus:border-blue-500
                "
                            >
                                <span className="truncate">
                                    {role
                                        ? roles.find((r) => r.id === role)?.label
                                        : 'Select your role'}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md">
                                    <div className="p-1">
                                        {roles.map((r) => (
                                            <div
                                                key={r.id}
                                                onClick={() => {
                                                    setRole(r.id);
                                                    setDropdownOpen(false);
                                                }}
                                                className="
                          cursor-pointer rounded-sm px-2 py-1.5 text-sm
                          text-gray-900 hover:bg-gray-100
                        "
                                            >
                                                {r.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" className="w-full">
                        Login
                    </Button>
                </form>
            </div>
        </div>
    );
}
