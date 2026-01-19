import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Info } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Login() {
    const navigate = useNavigate();
    const [role, setRole] = useState('');
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
        // TODO: Connect to Backend API (POST /api/auth/login)
        // For now, redirect based on selected Role (Demo Flow)
        if (role) {
            console.log('Logging in as:', role, formData);
            navigate(`/${role}`);
        } else {
            alert("Please select a role for this demo.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="flex items-center gap-2.5">
                        <div className="bg-gradient-to-br from-blue-500 to-teal-400 p-2 rounded-lg text-white">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Login</h1>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Email / ID"
                        placeholder="Enter your email or ID"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />

                    {/* Role Dropdown (Demo) */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Login As (Demo)</label>
                        <div className="relative">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-600"
                            >
                                <option value="" disabled>Select your role</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.label}</option>
                                ))}
                            </select>
                            {/* Custom Chevron can go here if needed, keeping simple native select for now */}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800 leading-relaxed">
                            <span className="font-semibold">Note:</span> Role will be detected automatically after login in production. Select a role above to view the demo dashboard.
                        </p>
                    </div>

                    <Button type="submit">
                        Login
                    </Button>
                </form>
            </div>
        </div>
    );
}
