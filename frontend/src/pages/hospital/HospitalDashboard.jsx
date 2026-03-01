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
    Brain,
    Key,
    Copy,
    Edit,
    XCircle,
    UserCog,
    Trash2,
    UserCheck,
    UserX,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import AiAnalytics from './AiAnalytics';
import { hospitalService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function HospitalDashboard() {
    const navigate = useNavigate();
    const { profile, signOut } = useAuth();

    const [activeTab, setActiveTab] = useState('departments');
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [registrationResult, setRegistrationResult] = useState(null); // { name, email, tempPassword, role }

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [hospitalActive, setHospitalActive] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [staff, setStaff] = useState([]);
    const [stats, setStats] = useState({ doctors: 0, staff: 0, active: 0 });
    const [manageAccountsOpen, setManageAccountsOpen] = useState(false);

    // Error state
    const [error, setError] = useState(null);
    const [registrationError, setRegistrationError] = useState(null);

    // Edit Doctor modal
    const [editDoctorOpen, setEditDoctorOpen] = useState(false);
    const [editDoctorData, setEditDoctorData] = useState({ id: '', name: '', dept: '', specialization: '' });

    // Edit Staff modal
    const [editStaffOpen, setEditStaffOpen] = useState(false);
    const [editStaffData, setEditStaffData] = useState({ id: '', name: '', dept: '' });

    // Form States
    const [newDeptData, setNewDeptData] = useState({ id: '', name: '', head: '', doctors: 0, staff: 0 });
    const [newDoctorData, setNewDoctorData] = useState({ name: '', email: '', dept: '', specialization: '' });
    const [newStaffData, setNewStaffData] = useState({ name: '', email: '', dept: '' });

    // Filters
    const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));
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
        if (profile?.hospital_id) fetchDashboardData();
    }, [profile]);

    const fetchDashboardData = async () => {
        if (!profile?.hospital_id) return;
        try {
            setLoading(true);
            setError(null);
            const [deptData, docData, staffData, statsData] = await Promise.all([
                hospitalService.getDepartments(profile.hospital_id),
                hospitalService.getDoctors(profile.hospital_id),
                hospitalService.getStaff(profile.hospital_id),
                hospitalService.getStats(profile.hospital_id),
            ]);
            setDepartments(deptData);
            setDoctors(docData);
            setStaff(staffData);
            setStats(statsData);

            // Check if this hospital account is still active (always active for now)
            setHospitalActive(true);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleSetAccountStatus = async (id, isActive) => {
        try {
            await hospitalService.setAccountStatus(id, isActive);
            await fetchDashboardData();
        } catch (err) {
            console.error('Failed to update status', err);
            alert('Failed to update status: ' + err.message);
        }
    };

    const handleDeleteAccount = async (id, name) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete account for ${name}? Historical records will be preserved.`)) return;
        try {
            await hospitalService.deleteAccount(id);
            await fetchDashboardData();
        } catch (err) {
            console.error('Failed to delete account', err);
            alert('Failed to delete account: ' + err.message);
        }
    };

    const handleEditDoctor = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await hospitalService.updateDoctor(editDoctorData.id, {
                department_id: editDoctorData.dept || null,
                specialization: editDoctorData.specialization || null,
            });
            setEditDoctorOpen(false);
            // Refresh all data so department doctor counts update too
            await fetchDashboardData();
        } catch (err) {
            console.error('Failed to update doctor', err);
            alert('Failed to update doctor: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openEditDoctor = (doc) => {
        setEditDoctorData({ id: doc.id, name: doc.name, dept: doc.dept, specialization: doc.spec });
        setEditDoctorOpen(true);
    };

    const handleEditStaff = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await hospitalService.updateStaff(editStaffData.id, {
                department_id: editStaffData.dept || null,
            });
            setEditStaffOpen(false);
            // Refresh all data so department staff counts update
            await fetchDashboardData();
        } catch (err) {
            console.error('Failed to update staff', err);
            alert('Failed to update staff: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openEditStaff = (s) => {
        setEditStaffData({ id: s.id, name: s.name, dept: s.dept });
        setEditStaffOpen(true);
    };


    const handleAddDepartment = async (e) => {
        e.preventDefault();
        try {
            await hospitalService.addDepartment(newDeptData, profile.hospital_id);
            setIsDeptModalOpen(false);
            setNewDeptData({ id: '', name: '', head: '', doctors: 0, staff: 0 });
            fetchDashboardData();
        } catch (err) {
            console.error('Failed to add department', err);
            alert('Failed to add department: ' + err.message);
        }
    };

    const handleRegisterDoctor = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setRegistrationError(null);
        try {
            if (!profile?.hospital_id) throw new Error("Hospital session expired. Please refresh.");

            const result = await hospitalService.registerDoctor(newDoctorData, profile.hospital_id);
            setIsDoctorModalOpen(false);
            setRegistrationResult({
                name: newDoctorData.name,
                email: newDoctorData.email,
                tempPassword: result.temp_password,
                role: 'Doctor',
            });
            setNewDoctorData({ name: '', email: '', dept: '', specialization: '' });
            fetchDashboardData();
        } catch (err) {
            console.error('Failed to register doctor', err);
            const msg = err.message || '';
            if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
                setRegistrationError('This email is already registered with another account.');
            } else {
                setRegistrationError('Failed to register doctor: ' + msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegisterStaff = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setRegistrationError(null);
        try {
            if (!profile?.hospital_id) throw new Error("Hospital session expired. Please refresh.");

            const result = await hospitalService.registerStaff(newStaffData, profile.hospital_id);
            setIsStaffModalOpen(false);
            setRegistrationResult({
                name: newStaffData.name,
                email: newStaffData.email,
                tempPassword: result.temp_password,
                role: 'Staff',
            });
            setNewStaffData({ name: '', email: '', dept: '' });
            fetchDashboardData();
        } catch (err) {
            console.error('Failed to register staff', err);
            const msg = err.message || '';
            if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
                setRegistrationError('This email is already registered with another account.');
            } else {
                setRegistrationError('Failed to register staff: ' + msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading dashboard…</p>
                </div>
            </div>
        );
    }

    // Suspended hospital screen
    if (!hospitalActive) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white border border-red-200 rounded-2xl p-12 max-w-md text-center shadow-sm">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h2>
                    <p className="text-gray-500 mb-6">This hospital account has been disabled by the system administrator. Please contact the admin to restore access.</p>
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm">
                        Logout
                    </button>
                </div>
            </div>
        );
    }

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
                            <p className="text-xs text-gray-500">{profile?.full_name ?? 'Hospital Admin'}</p>
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

                    {/* Manage Accounts Sidebar Expansion */}
                    <div className="pt-4 border-t border-gray-100 mt-2">
                        <button
                            onClick={() => setManageAccountsOpen(!manageAccountsOpen)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <UserCog className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                <span>Manage Accounts</span>
                            </div>
                            {manageAccountsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        {manageAccountsOpen && (
                            <div className="ml-9 mt-1 space-y-1 animate-in slide-in-from-top-1">
                                <button
                                    onClick={() => setActiveTab('manage-doctors')}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${activeTab === 'manage-doctors' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    Manage Doctors
                                </button>
                                <button
                                    onClick={() => setActiveTab('manage-staff')}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${activeTab === 'manage-staff' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    Manage Staff
                                </button>
                            </div>
                        )}
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

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
                        <strong>Error loading data:</strong> {error}
                    </div>
                )}

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
                                {filteredDepartments.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400">
                                        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No departments found</p>
                                        <p className="text-sm mt-1">Add your first department using the button above</p>
                                    </div>
                                ) : (
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
                                                            {dept.status ?? 'Active'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
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
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                {filteredDoctors.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400">
                                        <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No doctors found</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-left sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Department</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Specialization</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Join Date</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredDoctors.map((doc) => (
                                                <tr key={doc.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 text-sm text-gray-900 flex items-center gap-2">
                                                        {doc.name}
                                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Doctor</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{doc.dept}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{doc.spec}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{doc.join}</td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => openEditDoctor(doc)}
                                                            className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" /> Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
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
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                {filteredStaff.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400">
                                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No staff members found</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-left sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Department</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Join Date</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredStaff.map((s) => (
                                                <tr key={s.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 text-sm text-gray-900 flex items-center gap-2">
                                                        {s.name}
                                                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Staff</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{s.dept}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{s.join}</td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => openEditStaff(s)}
                                                            className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" /> Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {/* AI Analytics Tab */}
                    {activeTab === 'aianalytics' && (
                        <AiAnalytics />
                    )}

                    {/* Manage Doctors View */}
                    {activeTab === 'manage-doctors' && (
                        <>
                            <div className="p-6 border-b border-gray-100 bg-white">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Manage Doctor Accounts</h3>
                                        <p className="text-sm text-gray-500">Enable/Disable doctor logins or permenantly remove accounts</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={doctorSearch}
                                        onChange={(e) => setDoctorSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-left sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Doctor Name</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Login Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredDoctors.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{doc.email}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleSetAccountStatus(doc.id, !doc.active)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${doc.active
                                                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                            : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                                                    >
                                                        {doc.active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                                        {doc.active ? 'ENABLED' : 'DISABLED'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteAccount(doc.id, doc.name)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Permanently Delete Account"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Manage Staff View */}
                    {activeTab === 'manage-staff' && (
                        <>
                            <div className="p-6 border-b border-gray-100 bg-white">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Manage Staff Accounts</h3>
                                        <p className="text-sm text-gray-500">Enable/Disable staff logins or permenantly remove accounts</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={staffSearch}
                                        onChange={(e) => setStaffSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-left sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Staff Name</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Login Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredStaff.map((s) => (
                                            <tr key={s.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{s.email}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleSetAccountStatus(s.id, !s.active)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${s.active
                                                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                            : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                                                    >
                                                        {s.active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                                        {s.active ? 'ENABLED' : 'DISABLED'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteAccount(s.id, s.name)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Permanently Delete Account"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
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
                onClose={() => { setIsDoctorModalOpen(false); setNewDoctorData({ name: '', email: '', dept: '', specialization: '' }); setRegistrationError(null); }}
                title="Register New Doctor"
            >
                <form className="space-y-4" onSubmit={handleRegisterDoctor}>
                    {registrationError && (
                        <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2 text-sm text-red-700">
                            <AlertTriangle className="w-4 h-4" />
                            {registrationError}
                        </div>
                    )}
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
                    <Input
                        label="Specialization"
                        placeholder="e.g. Cardiologist"
                        value={newDoctorData.specialization}
                        onChange={(e) => setNewDoctorData({ ...newDoctorData, specialization: e.target.value })}
                    />
                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                        A temporary password will be auto-generated and the doctor can reset it on first login.
                    </div>
                    <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 mt-6 flex items-center gap-2">
                        {submitting ? <><Loader className="w-4 h-4 animate-spin" /> Registering…</> : 'Register Doctor'}
                    </Button>
                </form>
            </Modal>

            {/* Modal: Register Staff */}
            <Modal
                isOpen={isStaffModalOpen}
                onClose={() => { setIsStaffModalOpen(false); setNewStaffData({ name: '', email: '', dept: '' }); setRegistrationError(null); }}
                title="Register New Staff"
            >
                <form className="space-y-4" onSubmit={handleRegisterStaff}>
                    {registrationError && (
                        <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2 text-sm text-red-700">
                            <AlertTriangle className="w-4 h-4" />
                            {registrationError}
                        </div>
                    )}
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
                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                        A temporary password will be auto-generated and the staff member can reset it on first login.
                    </div>
                    <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 mt-6 flex items-center gap-2">
                        {submitting ? <><Loader className="w-4 h-4 animate-spin" /> Registering…</> : 'Register Staff'}
                    </Button>
                </form>
            </Modal>

            {/* Modal: Registration Success — show temp password */}
            <Modal
                isOpen={!!registrationResult}
                onClose={() => setRegistrationResult(null)}
                title="Registration Successful"
            >
                {registrationResult && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-green-900 text-sm">{registrationResult.role} registered successfully</p>
                                <p className="text-xs text-green-700 mt-0.5">{registrationResult.name}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                                <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">{registrationResult.email}</p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5" /> Temporary Password
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-sm font-mono font-bold text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-100 tracking-widest">
                                        {registrationResult.tempPassword}
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(registrationResult.tempPassword)}
                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                        title="Copy password"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
                            <strong>⚠ Share securely:</strong> Provide this password to the {registrationResult.role.toLowerCase()} directly.
                            They must use <strong>"Forgot password?"</strong> on the login page to set their own permanent password.
                        </div>

                        <Button
                            onClick={() => setRegistrationResult(null)}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            Done
                        </Button>
                    </div>
                )}
            </Modal>
            <Modal
                isOpen={editDoctorOpen}
                onClose={() => setEditDoctorOpen(false)}
                title={`Edit Doctor — ${editDoctorData.name}`}
            >
                <form className="space-y-4" onSubmit={handleEditDoctor}>
                    <Select
                        label="Department"
                        placeholder="Select department"
                        options={departmentOptions}
                        value={editDoctorData.dept}
                        onChange={(val) => setEditDoctorData({ ...editDoctorData, dept: val })}
                    />
                    <Input
                        label="Specialization"
                        placeholder="e.g. Cardiologist"
                        value={editDoctorData.specialization}
                        onChange={(e) => setEditDoctorData({ ...editDoctorData, specialization: e.target.value })}
                    />
                    <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
                        {submitting ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
                    </Button>
                </form>
            </Modal>

            {/* Modal: Edit Staff */}
            <Modal
                isOpen={editStaffOpen}
                onClose={() => setEditStaffOpen(false)}
                title={`Edit Staff — ${editStaffData.name}`}
            >
                <form className="space-y-4" onSubmit={handleEditStaff}>
                    <Select
                        label="Department"
                        placeholder="Select department"
                        options={departmentOptions}
                        value={editStaffData.dept}
                        onChange={(val) => setEditStaffData({ ...editStaffData, dept: val })}
                    />
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                        Changing department will update staff count on the Departments tab.
                    </div>
                    <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
                        {submitting ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
