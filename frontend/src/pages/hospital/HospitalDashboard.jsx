import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    UserPlus,
    Users,
    AlertTriangle,
    LogOut,
    Stethoscope,
    Activity,
    CheckCircle,
    Plus,
    Search,
    TrendingUp,
    Info
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Toggle } from '../../components/ui/Toggle';

export default function HospitalDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('departments');
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

    // Mock Data
    const [departments] = useState([
        { id: 'DEPT001', name: 'Cardiology', head: 'Dr. Sarah Johnson', doctors: 12, staff: 35, active: true },
        { id: 'DEPT002', name: 'General Medicine', head: 'Dr. Michael Chen', doctors: 8, staff: 24, active: true },
        { id: 'DEPT003', name: 'Orthopedics', head: 'Dr. James Brown', doctors: 15, staff: 42, active: true },
        { id: 'DEPT004', name: 'ENT', head: 'Dr. Emily Williams', doctors: 10, staff: 28, active: true },
        { id: 'DEPT005', name: 'Emergency', head: 'Dr. Robert Davis', doctors: 18, staff: 55, active: true },
    ]);

    const [doctors, setDoctors] = useState([
        { id: 'DOC001', name: 'Dr. Sarah Johnson', dept: 'Cardiology', spec: 'Interventional Cardiology', join: '2023-05-10', active: true },
        { id: 'DOC002', name: 'Dr. Michael Chen', dept: 'General Medicine', spec: 'General Physician', join: '2023-06-15', active: true },
        { id: 'DOC003', name: 'Dr. Emily Williams', dept: 'ENT', spec: 'ENT Specialist', join: '2023-07-20', active: true },
        { id: 'DOC004', name: 'Dr. James Brown', dept: 'Orthopedics', spec: 'Orthopedic Surgeon', join: '2023-08-05', active: false },
    ]);

    const [staff, setStaff] = useState([
        { id: 'STAFF001', name: 'Alice Smith', dept: 'Cardiology', role: 'Nurse', join: '2023-04-12', active: true },
        { id: 'STAFF002', name: 'Bob Wilson', dept: 'Emergency', role: 'Paramedic', join: '2023-05-18', active: true },
        { id: 'STAFF003', name: 'Carol Martinez', dept: 'ENT', role: 'Registration Staff', join: '2023-06-22', active: true },
        { id: 'STAFF004', name: 'David Lee', dept: 'Orthopedics', role: 'Lab Technician', join: '2023-07-30', active: false },
    ]);

    const departmentOptions = departments.map(d => ({ value: d.name, label: d.name }));

    // Analytics Data
    const loadForecastData = [
        { name: 'Today', card: 65, gen: 85, orth: 45, ent: 30 },
        { name: '+7d', card: 70, gen: 88, orth: 48, ent: 32 },
        { name: '+14d', card: 80, gen: 95, orth: 52, ent: 35 },
        { name: '+21d', card: 120, gen: 140, orth: 85, ent: 58 },
        { name: '+30d', card: 155, gen: 170, orth: 90, ent: 60 },
    ];

    const diseaseData = [
        { name: 'Flu', value: 32, color: '#3B82F6' },
        { name: 'Diabetes', value: 21, color: '#10B981' },
        { name: 'Hypertension', value: 18, color: '#F59E0B' },
        { name: 'Respiratory Infections', value: 14, color: '#8B5CF6' },
        { name: 'Others', value: 15, color: '#6B7280' },
    ];

    const handleLogout = () => {
        navigate('/login');
    };

    const handleToggleDoctor = (id) => {
        setDoctors(doctors.map(d => d.id === id ? { ...d, active: !d.active } : d));
    };

    const handleToggleStaff = (id) => {
        setStaff(staff.map(s => s.id === id ? { ...s, active: !s.active } : s));
    };


    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 overflow-y-auto">
                <div className="p-6 border-b border-gray-100 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-lg">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-tight text-lg">Hospital Authority Dashboard</h1>
                            <p className="text-xs text-gray-500">City General Hospital</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-4">
                    <div className="space-y-2">
                        <button
                            onClick={() => setIsDoctorModalOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <UserPlus className="w-5 h-5 text-gray-500" />
                            Register Doctor
                        </button>
                        <button
                            onClick={() => setIsStaffModalOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <UserPlus className="w-5 h-5 text-gray-500" />
                            Register Staff
                        </button>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-6">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h4 className="font-bold text-red-900 text-sm">Medical Data Restricted</h4>
                        </div>
                        <p className="text-xs text-red-700 font-medium mb-2">Hospital Authority cannot access:</p>
                        <ul className="space-y-1.5">
                            {['Patient registration', 'Patient medical records', 'Clinical data or diagnoses', 'Any patient information'].map((item, i) => (
                                <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                        <h4 className="font-bold text-purple-900 text-sm mb-1">Your Scope</h4>
                        <p className="text-xs text-purple-700 mb-3 block">Hospital Workforce Management</p>
                        <ul className="space-y-2">
                            {['Department management', 'Doctor registration', 'Staff registration', 'AI Analytics (aggregated data)'].map((item, i) => (
                                <li key={i} className="text-xs text-purple-800 flex items-center gap-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
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

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Departments</p>
                            <h3 className="text-3xl font-bold text-gray-900">{departments.length}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Building2 className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Doctors</p>
                            <h3 className="text-3xl font-bold text-gray-900">63</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Stethoscope className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Staff</p>
                            <h3 className="text-3xl font-bold text-gray-900">184</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Active Today</p>
                            <h3 className="text-3xl font-bold text-gray-900">217</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <Activity className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-gray-100/50 p-1.5 rounded-xl w-fit">
                    {['Departments', 'Doctors', 'Staff', 'AI Analytics'].map((tab) => {
                        const id = tab.toLowerCase().replace(' ', '');
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab === 'AI Analytics' ? (
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        {tab}
                                    </div>
                                ) : tab}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">

                    {/* Departments Tab */}
                    {activeTab === 'departments' && (
                        <>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Department Management</h3>
                                    <p className="text-sm text-gray-500">Create and organize hospital departments</p>
                                </div>
                                <button
                                    onClick={() => setIsDeptModalOpen(true)}
                                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Department
                                </button>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Department ID</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Department Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Head of Department</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Doctors</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {departments.map((dept) => (
                                        <tr key={dept.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{dept.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{dept.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{dept.head}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{dept.doctors}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{dept.staff}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    {/* Doctors Tab */}
                    {activeTab === 'doctors' && (
                        <>
                            <div className="p-6 border-b border-gray-100 bg-white">
                                <h3 className="font-bold text-gray-900 text-lg">Doctor Management</h3>
                                <p className="text-sm text-gray-500">Manage doctor accounts and permissions</p>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Doctor ID</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Department</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Specialization</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Join Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Account Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {doctors.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 flex items-center gap-2">
                                                {doc.name}
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Doctor</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{doc.dept}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{doc.spec}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{doc.join}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${doc.active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-600 border-gray-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${doc.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                    {doc.active ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Toggle checked={doc.active} onChange={() => handleToggleDoctor(doc.id)} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    {/* Staff Tab */}
                    {activeTab === 'staff' && (
                        <>
                            <div className="p-6 border-b border-gray-100 bg-white">
                                <h3 className="font-bold text-gray-900 text-lg">Staff Management</h3>
                                <p className="text-sm text-gray-500">Manage staff accounts and permissions</p>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Staff ID</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Department</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Join Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Account Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {staff.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 flex items-center gap-2">
                                                {s.name}
                                                <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Staff</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{s.dept}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{s.role}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{s.join}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-600 border-gray-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                    {s.active ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Toggle checked={s.active} onChange={() => handleToggleStaff(s.id)} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    {/* AI Analytics Tab */}
                    {activeTab === 'aianalytics' && (
                        <div className="p-8 space-y-8">
                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-blue-900 text-sm">AI analytics support hospital planning and preventive care.</h4>
                                    <p className="text-xs text-blue-700">This dashboard does NOT provide diagnosis or patient-level insights.</p>
                                </div>
                            </div>

                            {/* Chart 1: Forecast */}
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-purple-600" />
                                            Department Load Forecast
                                        </h3>
                                        <p className="text-sm text-gray-500">Predicted patient load for the next 7-30 days</p>
                                    </div>
                                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                                        AI Prediction
                                    </div>
                                </div>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={loadForecastData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Line type="monotone" dataKey="card" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="Cardiology" />
                                            <Line type="monotone" dataKey="gen" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="General Medicine" />
                                            <Line type="monotone" dataKey="orth" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} name="Orthopedics" />
                                            <Line type="monotone" dataKey="ent" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} name="ENT" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 2: Disease Status */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col md:flex-row gap-8 items-center">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                                        <Activity className="w-5 h-5 text-purple-600" />
                                        Disease Trend Distribution
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6">Top diagnosis categories for the selected time period</p>
                                    <div className="h-64 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={diseaseData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {diseaseData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-bold text-gray-900">Top Conditions</span>
                                            <span className="text-xs text-gray-500">Last 30 Days</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-72 space-y-4">
                                    {diseaseData.map((d) => (
                                        <div key={d.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                                <span className="text-sm font-medium text-gray-700">{d.name}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{d.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal: Add Department */}
            <Modal
                isOpen={isDeptModalOpen}
                onClose={() => setIsDeptModalOpen(false)}
                title="Add New Department"
            >
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsDeptModalOpen(false); }}>
                    <Input label="Department ID *" placeholder="DEPT006" required />
                    <Input label="Department Name *" placeholder="e.g. Cardiology" required />
                    <Input label="Head of Department *" placeholder="Dr. Sarah Johnson" required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Doctors" placeholder="0" />
                        <Input label="Staff" placeholder="0" />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-4">
                        Department will be created and available for assignment.
                    </div>

                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                        Add Department
                    </Button>
                </form>
            </Modal>

            {/* Modal: Register Doctor */}
            <Modal
                isOpen={isDoctorModalOpen}
                onClose={() => setIsDoctorModalOpen(false)}
                title="Register New Doctor"
            >
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsDoctorModalOpen(false); }}>
                    <Input label="Doctor Name *" placeholder="Dr. John Doe" required />
                    <Input label="Email *" type="email" placeholder="doctor@hospital.com" required />
                    <Select
                        label="Department *"
                        placeholder="Select department"
                        options={departmentOptions}
                        onChange={() => { }}
                    />

                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700 mt-6">
                        Register Doctor
                    </Button>
                </form>
            </Modal>

            {/* Modal: Register Staff */}
            <Modal
                isOpen={isStaffModalOpen}
                onClose={() => setIsStaffModalOpen(false)}
                title="Register New Staff"
            >
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsStaffModalOpen(false); }}>
                    <Input label="Staff Name *" placeholder="Jane Doe" required />
                    <Input label="Email *" type="email" placeholder="staff@hospital.com" required />
                    <Select
                        label="Department *"
                        placeholder="Select department"
                        options={departmentOptions}
                        onChange={() => { }}
                    />

                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700 mt-6">
                        Register Staff
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
