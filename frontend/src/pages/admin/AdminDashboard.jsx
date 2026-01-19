import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    UserPlus,
    Users,
    AlertTriangle,
    LogOut,
    Building2,
    Search,
    CheckCircle,
    Activity
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    // Mock Data
    const [hospitals, setHospitals] = useState([
        { id: 'HA001', name: 'City General Hospital', date: '2024-01-15', active: true },
        { id: 'HA002', name: 'St. Mary\'s Medical', date: '2024-02-20', active: true },
        { id: 'HA003', name: 'Metro Health Center', date: '2024-03-10', active: true },
        { id: 'HA004', name: 'Community Care', date: '2024-12-20', active: false },
    ]);

    const handleToggle = (id) => {
        setHospitals(hospitals.map(h =>
            h.id === id ? { ...h, active: !h.active } : h
        ));
    };

    const handleLogout = () => {
        navigate('/login');
    };

    const activeSystems = hospitals.filter(h => h.active).length;
    const disabledSystems = hospitals.filter(h => !h.active).length;

    const [searchQuery, setSearchQuery] = useState('');

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar (unchanged) */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 overflow-y-auto">
                <div className="p-6 border-b border-gray-100 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-tight text-lg">Admin Dashboard</h1>
                            <p className="text-xs text-gray-500">System Administrator</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-6">
                    <button
                        onClick={() => setIsRegisterOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <UserPlus className="w-5 h-5" />
                        Register Hospital Authority
                    </button>

                    {/* Medical Data Restricted Box */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h4 className="font-bold text-red-900 text-sm">Medical Data Restricted</h4>
                        </div>
                        <p className="text-xs text-red-700 font-medium mb-2">Admins do NOT have access to:</p>
                        <ul className="space-y-1.5">
                            {['Patient medical records', 'Clinical data or diagnoses', 'Doctor/staff registration', 'Any patient information'].map((item, i) => (
                                <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Your Scope Box */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h4 className="font-bold text-blue-900 text-sm mb-1">Your Scope</h4>
                        <p className="text-xs text-blue-700 mb-3 block">System Control & Governance</p>
                        <ul className="space-y-2">
                            {['Hospital authority management', 'System access control', 'Audit & security logs'].map((item, i) => (
                                <li key={i} className="text-xs text-blue-800 flex items-center gap-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-100 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-80 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
                        <p className="text-gray-500">Manage system access and hospital authorities</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-gray-600">System Online</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{hospitals.length}</h3>
                        <p className="text-sm text-gray-500">Hospital Authorities</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Activity className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{activeSystems}</h3>
                        <p className="text-sm text-gray-500">Total Active Systems</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{disabledSystems}</h3>
                        <p className="text-sm text-gray-500">Disabled Systems</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">712</h3>
                        <p className="text-sm text-gray-500">Total System Users</p>
                    </div>
                </div>

                {/* Hospital Table */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Hospital Authority Management</h3>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search hospitals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 w-64"
                            />
                        </div>
                    </div>

                    <table className="w-full">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Authority ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hospital Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredHospitals.map((hospital) => (
                                <tr key={hospital.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{hospital.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{hospital.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{hospital.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${hospital.active
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${hospital.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            {hospital.active ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex justify-end">
                                        <Toggle
                                            checked={hospital.active}
                                            onChange={() => handleToggle(hospital.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Registration Modal */}
            <Modal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                title="Register New Hospital Authority"
            >
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsRegisterOpen(false); }}>
                    <Input label="Hospital Name" placeholder="Enter hospital name" required />
                    <Input label="Contact Email" type="email" placeholder="admin@hospital.com" required />
                    <Input label="Contact Phone" placeholder="+1 555-0100" />
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Address *</label>
                        <textarea
                            className="w-full h-24 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none"
                            placeholder="Hospital address"
                            required
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                        Login credentials will be auto-generated and sent to the hospital authority email.
                    </div>

                    <Button type="submit">
                        Create Hospital Authority
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
