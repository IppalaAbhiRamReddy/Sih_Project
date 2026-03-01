import React, { useState, useEffect } from 'react';
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
    Phone,
    Mail,
    MapPin,
    Calendar,
    Hash,
    Loader
} from 'lucide-react';
import { Edit, Save, X, KeySquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { adminService } from '../../services/api';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [editingHospital, setEditingHospital] = useState(false);
    const [editHospitalData, setEditHospitalData] = useState({});
    const [savingHospital, setSavingHospital] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hospitals, setHospitals] = useState([]);
    const [systemStats, setSystemStats] = useState({ totalUsers: 0 });
    const [registerFormData, setRegisterFormData] = useState({
        name: '',
        adminName: '',
        email: '',
        phone: '',
        address: ''
    });
    const [registrationSuccess, setRegistrationSuccess] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [registrationError, setRegistrationError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [hospitalsData, stats] = await Promise.all([
                adminService.getHospitals(),
                adminService.getSystemStats()
            ]);

            setHospitals((hospitalsData || []).map(h => ({
                ...h,
                date: new Date(h.created_at).toLocaleDateString()
            })));
            setSystemStats({ totalUsers: stats.totalUsers || 0 });
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };


    const handleEditHospitalSave = async () => {
        setSavingHospital(true);
        try {
            const updatedData = await adminService.updateHospital(selectedHospital.id, {
                contact_email: editHospitalData.contact_email,
                contact_phone: editHospitalData.contact_phone,
                address: editHospitalData.address,
            });
            const updated = { ...selectedHospital, ...updatedData };
            setSelectedHospital(updated);
            setHospitals(prev => prev.map(h => h.id === updated.id ? { ...h, ...updatedData } : h));
            setEditingHospital(false);
        } catch (err) {
            console.error('Failed to update hospital', err);
            alert('Failed to save: ' + err.message);
        } finally {
            setSavingHospital(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const result = await adminService.registerHospital(registerFormData);

            setRegistrationSuccess({
                email: registerFormData.email,
                password: result.temp_password,
                hospitalName: registerFormData.name
            });

            setRegisterFormData({ name: '', adminName: '', email: '', phone: '', address: '' });
            fetchDashboardData();
        } catch (error) {
            console.error('Registration failed', error);
            const msg = error.message || '';
            if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
                alert('This email is already registered with another account. Please use a different email.');
            } else {
                alert('Failed to register hospital: ' + msg);
            }
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };


    const filteredHospitals = hospitals.filter(h =>
        h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.id?.toLowerCase().includes(searchQuery.toLowerCase())
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
                            {['Register Hospital Authority', 'Hospital authority management', 'Hospital Authority Stats'].map((item, i) => (
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
                        Admin
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{systemStats.totalUsers}</h3>
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
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 text-right">Registered Date</th>
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
                                        <td className="px-6 py-4 text-sm text-gray-500 text-right">{hospital.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                title="Register New Hospital Authority"
            >
                <form className="space-y-4" onSubmit={handleRegister}>
                    <Input
                        label="Hospital Name"
                        placeholder="e.g. City General Hospital"
                        required
                        value={registerFormData.name}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, name: e.target.value })}
                    />
                    <Input
                        label="Authority Admin Name"
                        placeholder="e.g. Dr. Jane Smith"
                        required
                        value={registerFormData.adminName}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, adminName: e.target.value })}
                    />
                    <Input
                        label="Contact Email"
                        type="email"
                        placeholder="admin@hospital.com"
                        required
                        value={registerFormData.email}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, email: e.target.value })}
                    />
                    <Input
                        label="Contact Phone"
                        placeholder="+1 555-0100"
                        value={registerFormData.phone}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, phone: e.target.value })}
                    />
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Address *</label>
                        <textarea
                            className="w-full h-24 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none"
                            placeholder="Hospital address"
                            required
                            value={registerFormData.address}
                            onChange={(e) => setRegisterFormData({ ...registerFormData, address: e.target.value })}
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                        Login credentials will be temporary generated and Hospital authorities can change their password.
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2">
                        {submitting ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Create Hospital Authority'
                        )}
                    </Button>
                </form>
            </Modal>

            {/* Registration Success Modal */}
            <Modal
                isOpen={!!registrationSuccess}
                onClose={() => { setRegistrationSuccess(null); setIsRegisterOpen(false); }}
                title="Hospital Authority Created"
            >
                <div className="space-y-6 py-2">
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Registration Successful!</h3>
                        <p className="text-sm text-gray-500 max-w-xs">
                            Access credentials generated for <span className="font-semibold text-gray-700">{registrationSuccess?.hospitalName}</span>.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Login Email</label>
                            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                <span className="text-sm font-medium text-gray-700">{registrationSuccess?.email}</span>
                                <Mail className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Temporary Password</label>
                            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200 shadow-sm ring-2 ring-blue-50">
                                <span className="text-sm font-bold text-blue-700 font-mono tracking-wider">{registrationSuccess?.password}</span>
                                <KeySquare className="w-4 h-4 text-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <span className="font-bold">IMPORTANT:</span> Share these credentials securely. The temporary password will not be shown again. The hospital authority should change it upon their first login.
                        </p>
                    </div>

                    <Button className="w-full py-4 rounded-xl text-lg font-bold shadow-lg" onClick={() => { setRegistrationSuccess(null); setIsRegisterOpen(false); }}>
                        I've Saved These Details
                    </Button>
                </div>
            </Modal>

            {/* Hospital Details Modal */}
            <Modal
                isOpen={!!selectedHospital}
                onClose={() => { setSelectedHospital(null); setEditingHospital(false); }}
                title="Hospital Authority Management"
            >
                {selectedHospital && (
                    <div className="space-y-6">
                        {/* Premium Header Card */}
                        <div className="relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
                            <div className="relative flex items-center gap-5 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                                    <Building2 className="w-7 h-7 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-extrabold text-gray-900 text-xl tracking-tight leading-none mb-1">
                                        {selectedHospital.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">
                                            ID: {selectedHospital.id}
                                        </span>
                                    </div>
                                </div>
                                {!editingHospital && (
                                    <button
                                        onClick={() => {
                                            setEditHospitalData({
                                                contact_email: selectedHospital.contact_email,
                                                contact_phone: selectedHospital.contact_phone,
                                                address: selectedHospital.address
                                            });
                                            setEditingHospital(true);
                                        }}
                                        className="p-2.5 bg-gray-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm border border-gray-200 hover:border-blue-600"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    {editingHospital ? 'Edit Information' : 'Contact Details'}
                                </label>
                                {editingHospital && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleEditHospitalSave}
                                            disabled={savingHospital}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-lg text-xs font-bold transition-all border border-green-100"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            {savingHospital ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            onClick={() => setEditingHospital(false)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all border border-gray-200"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {editingHospital ? (
                                <div className="space-y-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <Input
                                        label="Contact Email"
                                        type="email"
                                        value={editHospitalData.contact_email ?? ''}
                                        onChange={(e) => setEditHospitalData({ ...editHospitalData, contact_email: e.target.value })}
                                        className="bg-white"
                                    />
                                    <Input
                                        label="Contact Phone"
                                        value={editHospitalData.contact_phone ?? ''}
                                        onChange={(e) => setEditHospitalData({ ...editHospitalData, contact_phone: e.target.value })}
                                        className="bg-white"
                                    />
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700">Physical Address</label>
                                        <textarea
                                            className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none shadow-sm font-medium"
                                            value={editHospitalData.address ?? ''}
                                            onChange={(e) => setEditHospitalData({ ...editHospitalData, address: e.target.value })}
                                            placeholder="Enter full hospital address..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                                            <p className="text-sm font-semibold text-gray-700">{selectedHospital.contact_email ?? '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                                            <p className="text-sm font-semibold text-gray-700">{selectedHospital.contact_phone ?? '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
                                            <p className="text-sm font-semibold text-gray-700 line-clamp-2 leading-relaxed">
                                                {selectedHospital.address ?? '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center pt-2">
                            <Button
                                variant="outline"
                                onClick={() => { setSelectedHospital(null); setEditingHospital(false); }}
                                className="w-full py-3 rounded-xl border-gray-200 text-gray-600 hover:bg-blue-50 font-bold tracking-wide transition-all"
                            >
                                Close Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

