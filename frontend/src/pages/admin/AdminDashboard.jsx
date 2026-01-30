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
    Activity,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Hash
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState(null);

    // Mock Data
    const [hospitals, setHospitals] = useState([
        { id: 'HA001', name: 'City General Hospital', date: '2024-01-15', active: true, email: 'admin@citygeneral.com', phone: '+1 555-0101', address: '123 Healthcare Blvd, Medical District, NY 10001' },
        { id: 'HA002', name: 'St. Mary\'s Medical', date: '2024-02-20', active: true, email: 'contact@stmarys.org', phone: '+1 555-0102', address: '456 Saint Mary St, Downtown, CA 90012' },
        { id: 'HA003', name: 'Metro Health Center', date: '2024-03-10', active: true, email: 'support@metrohealth.com', phone: '+1 555-0103', address: '789 Metro Ave, Uptown, IL 60614' },
        { id: 'HA004', name: 'Community Care', date: '2024-12-20', active: false, email: 'info@communitycare.org', phone: '+1 555-0104', address: '321 Community Ln, Suburbia, TX 75001' },
        { id: 'HA005', name: 'Westside Medical', date: '2024-04-05', active: true, email: 'admin@westside.med', phone: '+1 555-0105', address: '654 Westside Dr, West End, WA 98101' },
        { id: 'HA006', name: 'Eastside Clinic', date: '2024-05-12', active: true, email: 'contact@eastside.clinic', phone: '+1 555-0106', address: '987 Eastside Rd, East End, MA 02110' },
        { id: 'HA007', name: 'North Health', date: '2024-06-18', active: false, email: 'admin@northhealth.org', phone: '+1 555-0107', address: '159 North Way, Northside, FL 33101' },
        { id: 'HA008', name: 'South General', date: '2024-07-22', active: true, email: 'info@southgeneral.com', phone: '+1 555-0108', address: '753 South Blvd, Southside, GA 30303' },
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
                    <span
                        data-slot="badge"
                        className="inline-flex items-center justify-center rounded-md border text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden [a&]:hover:bg-accent [a&]:hover:text-accent-foreground bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1"
                    >
                        <Shield className="w-3 h-3 mr-1" />
                        ADMIN ACCESS
                    </span>
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

                {/* Hospital Table Container */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[400px]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
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

                    <div className="overflow-y-auto flex-1">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Authority ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Hospital Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Registered Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Account Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right bg-gray-50">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredHospitals.map((hospital) => (
                                    <tr
                                        key={hospital.id}
                                        onClick={() => setSelectedHospital(hospital)}
                                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{hospital.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium group-hover:text-blue-700 transition-colors">{hospital.name}</td>
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
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Toggle
                                                    checked={hospital.active}
                                                    onChange={() => handleToggle(hospital.id)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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

            {/* Hospital Details Modal */}
            <Modal
                isOpen={!!selectedHospital}
                onClose={() => setSelectedHospital(null)}
                title="Hospital Authority Details"
            >
                {selectedHospital && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{selectedHospital.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 text-xs text-gray-600">
                                        {selectedHospital.id}
                                    </span>
                                    <span>•</span>
                                    <span>Registered {selectedHospital.date}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Information</label>
                                <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                                    <div className="flex items-center gap-3 p-3">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-700">{selectedHospital.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-700">{selectedHospital.phone}</span>
                                    </div>
                                    <div className="flex items-start gap-3 p-3">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <span className="text-sm text-gray-700">{selectedHospital.address}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Status</label>
                                <div className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Account Status</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedHospital.active
                                        ? 'bg-green-50 text-green-700 border-green-100'
                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${selectedHospital.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        {selectedHospital.active ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button variant="outline" onClick={() => setSelectedHospital(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
