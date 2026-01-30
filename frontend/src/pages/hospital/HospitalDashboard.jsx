import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Shield,
    UserPlus,
    Users,
    AlertTriangle,
    LogOut,
    Stethoscope,
    Activity,
    CheckCircle,
    Plus,
    Search,
    Filter,
    Brain
} from 'lucide-react';

import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Toggle } from '../../components/ui/Toggle';
import AiAnalytics from './AiAnalytics';
import { hospitalService } from '../../services/api';

export default function HospitalDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('departments');
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [staff, setStaff] = useState([]);
    const [stats, setStats] = useState({ doctors: 0, staff: 0, active: 0 });

    // Form States
    const [newDeptData, setNewDeptData] = useState({ id: '', name: '', head: '', doctors: 0, staff: 0 });
    const [newDoctorData, setNewDoctorData] = useState({ name: '', email: '', dept: '' });
    const [newStaffData, setNewStaffData] = useState({ name: '', email: '', dept: '' });

    // Filters
    const departmentOptions = departments.map(d => ({ value: d.name, label: d.name }));
    const filterDeptOptions = [{ value: 'All', label: 'All Departments' }, ...departmentOptions];

    const [deptSearch, setDeptSearch] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');
    const [doctorDeptFilter, setDoctorDeptFilter] = useState('All');
    const [staffSearch, setStaffSearch] = useState('');
    const [staffDeptFilter, setStaffDeptFilter] = useState('All');

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
        d.id.toLowerCase().includes(deptSearch.toLowerCase())
    );

    const filteredDoctors = doctors.filter(d =>
        (doctorDeptFilter === 'All' || d.dept === doctorDeptFilter) &&
        (d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
            d.id.toLowerCase().includes(doctorSearch.toLowerCase()))
    );

    const filteredStaff = staff.filter(s =>
        (staffDeptFilter === 'All' || s.dept === staffDeptFilter) &&
        (s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
            s.id.toLowerCase().includes(staffSearch.toLowerCase()))
    );

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [deptData, docData, staffData, statsData] = await Promise.all([
                hospitalService.getDepartments(),
                hospitalService.getDoctors(),
                hospitalService.getStaff(),
                hospitalService.getStats()
            ]);
            setDepartments(deptData);
            setDoctors(docData);
            setStaff(staffData);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        navigate('/login');
    };

    const handleToggleDoctor = async (id) => {
        try {
            await hospitalService.toggleDoctorStatus(id);
            setDoctors(doctors.map(d => d.id === id ? { ...d, active: !d.active } : d));
        } catch (error) {
            console.error("Failed to toggle doctor status", error);
        }
    };

    const handleToggleStaff = async (id) => {
        try {
            await hospitalService.toggleStaffStatus(id);
            setStaff(staff.map(s => s.id === id ? { ...s, active: !s.active } : s));
        } catch (error) {
            console.error("Failed to toggle staff status", error);
        }
    };

    const handleAddDepartment = async (e) => {
        e.preventDefault();
        try {
            await hospitalService.addDepartment(newDeptData);
            setIsDeptModalOpen(false);
            setNewDeptData({ id: '', name: '', head: '', doctors: 0, staff: 0 });
            fetchDashboardData();
            alert("Department added successfully");
        } catch (error) {
            console.error("Failed to add department", error);
            alert("Failed to add department");
        }
    };

    const handleRegisterDoctor = async (e) => {
        e.preventDefault();
        try {
            await hospitalService.registerDoctor(newDoctorData);
            setIsDoctorModalOpen(false);
            setNewDoctorData({ name: '', email: '', dept: '' });
            fetchDashboardData();
            alert("Doctor registered successfully");
        } catch (error) {
            console.error("Failed to register doctor", error);
            alert("Failed to register doctor");
        }
    };

    const handleRegisterStaff = async (e) => {
        e.preventDefault();
        try {
            await hospitalService.registerStaff(newStaffData);
            setIsStaffModalOpen(false);
            setNewStaffData({ name: '', email: '', dept: '' });
            fetchDashboardData();
            alert("Staff registered successfully");
        } catch (error) {
            console.error("Failed to register staff", error);
            alert("Failed to register staff");
        }
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
                            <h3 className="text-3xl font-bold text-gray-900">{stats.doctors}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Stethoscope className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Staff</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.staff}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Active Today</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.active}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <Activity className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    {/* Tabs */}
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                        {['Departments', 'Doctors', 'Staff', 'AI Analytics'].map((tab) => {
                            const id = tab.toLowerCase().replace(' ', '');
                            const isActive = activeTab === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab === 'AI Analytics' ? (
                                        <div className="flex items-center gap-2">
                                            <Brain className="w-4 h-4" />
                                            {tab}
                                        </div>
                                    ) : tab}
                                </button>
                            );
                        })}
                    </div>

                    {/* Hospital Authority Badge */}
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full">
                        <Shield className="w-4 h-4 text-blue-700" />
                        <span className="text-xs font-bold text-blue-700 tracking-wider">HOSPITAL AUTHORITY</span>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm animate-fade-in">

                    {/* Departments Tab */}
                    {activeTab === 'departments' && (
                        <>
                            <div className="p-6 border-b border-gray-100 bg-white space-y-4">
                                <div className="flex justify-between items-center">
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
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search departments..."
                                        value={deptSearch}
                                        onChange={(e) => setDeptSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500"
                                    />
                                </div>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-left sticky top-0 z-10">
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
                                        {filteredDepartments.map((dept) => (
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
                            </div>
                        </>
                    )}

                    {/* Doctors Tab */}
                    {activeTab === 'doctors' && (
                        <>
                            <div className="p-6 border-b border-gray-100 bg-white space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Doctor Management</h3>
                                        <p className="text-sm text-gray-500">Manage doctor accounts and permissions</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search doctors..."
                                            value={doctorSearch}
                                            onChange={(e) => setDoctorSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="w-64">
                                        <Select
                                            value={doctorDeptFilter}
                                            onChange={setDoctorDeptFilter}
                                            options={filterDeptOptions}
                                            placeholder="Filter by Department"
                                            className="search-select"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-left sticky top-0 z-10">
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
                                        {filteredDoctors.map((doc) => (
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
                            </div>
                        </>
                    )}

                    {/* Staff Tab */}
                    {activeTab === 'staff' && (
                        <>
                            <div className="p-6 border-b border-gray-100 bg-white space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Staff Management</h3>
                                        <p className="text-sm text-gray-500">Manage staff accounts and permissions</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search staff..."
                                            value={staffSearch}
                                            onChange={(e) => setStaffSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="w-64">
                                        <Select
                                            value={staffDeptFilter}
                                            onChange={setStaffDeptFilter}
                                            options={filterDeptOptions}
                                            placeholder="Filter by Department"
                                            className="search-select"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-left sticky top-0 z-10">
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
                                        {filteredStaff.map((s) => (
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
                            </div>
                        </>
                    )}

                    {/* AI Analytics Tab */}
                    {/* AI Analytics Tab */}
                    {activeTab === 'aianalytics' && (
                        <AiAnalytics />
                    )}
                </div>
            </main>

            {/* Modal: Add Department */}
            <Modal
                isOpen={isDeptModalOpen}
                onClose={() => setIsDeptModalOpen(false)}
                title="Add New Department"
            >
                <form className="space-y-4" onSubmit={handleAddDepartment}>
                    <Input
                        label="Department ID *"
                        placeholder="DEPT006"
                        required
                        value={newDeptData.id}
                        onChange={(e) => setNewDeptData({ ...newDeptData, id: e.target.value })}
                    />
                    <Input
                        label="Department Name *"
                        placeholder="e.g. Cardiology"
                        required
                        value={newDeptData.name}
                        onChange={(e) => setNewDeptData({ ...newDeptData, name: e.target.value })}
                    />
                    <Input
                        label="Head of Department *"
                        placeholder="Dr. Sarah Johnson"
                        required
                        value={newDeptData.head}
                        onChange={(e) => setNewDeptData({ ...newDeptData, head: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Doctors"
                            placeholder="0"
                            value={newDeptData.doctors}
                            onChange={(e) => setNewDeptData({ ...newDeptData, doctors: e.target.value })}
                        />
                        <Input
                            label="Staff"
                            placeholder="0"
                            value={newDeptData.staff}
                            onChange={(e) => setNewDeptData({ ...newDeptData, staff: e.target.value })}
                        />
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
                onClose={() => { setIsDoctorModalOpen(false); setNewDoctorData({ name: '', email: '', dept: '' }); }}
                title="Register New Doctor"
            >
                <form className="space-y-4" onSubmit={handleRegisterDoctor}>
                    <Input
                        label="Doctor Name *"
                        placeholder="Dr. John Doe"
                        required
                        value={newDoctorData.name}
                        onChange={(e) => setNewDoctorData({ ...newDoctorData, name: e.target.value })}
                    />
                    <Input
                        label="Email *"
                        type="email"
                        placeholder="doctor@hospital.com"
                        required
                        value={newDoctorData.email}
                        onChange={(e) => setNewDoctorData({ ...newDoctorData, email: e.target.value })}
                    />
                    <Select
                        label="Department *"
                        placeholder="Select department"
                        options={departmentOptions}
                        value={newDoctorData.dept}
                        onChange={(val) => setNewDoctorData({ ...newDoctorData, dept: val })}
                    />

                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700 mt-6">
                        Register Doctor
                    </Button>
                </form>
            </Modal>

            {/* Modal: Register Staff */}
            <Modal
                isOpen={isStaffModalOpen}
                onClose={() => { setIsStaffModalOpen(false); setNewStaffData({ name: '', email: '', dept: '' }); }}
                title="Register New Staff"
            >
                <form className="space-y-4" onSubmit={handleRegisterStaff}>
                    <Input
                        label="Staff Name *"
                        placeholder="Jane Doe"
                        required
                        value={newStaffData.name}
                        onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                    />
                    <Input
                        label="Email *"
                        type="email"
                        placeholder="staff@hospital.com"
                        required
                        value={newStaffData.email}
                        onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                    />
                    <Select
                        label="Department *"
                        placeholder="Select department"
                        options={departmentOptions}
                        value={newStaffData.dept}
                        onChange={(val) => setNewStaffData({ ...newStaffData, dept: val })}
                    />

                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700 mt-6">
                        Register Staff
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
