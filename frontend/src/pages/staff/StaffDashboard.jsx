import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    UserPlus,
    Edit,
    AlertTriangle,
    CheckCircle,
    LogOut,
    Activity,
    CheckSquare,
    Search,
    X,
    Plus,
    Syringe,
    Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../../components/shared/Modal';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { Select } from '../../components/shared/Select';
import { staffService, patientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/shared/TableSkeleton';

export default function StaffDashboard() {
    const navigate = useNavigate();
    const { profile, signOut } = useAuth();
    const today = new Date().toISOString().split('T')[0];
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [successState, setSuccessState] = useState({ isOpen: false, type: '', data: null });
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [viewingPatient, setViewingPatient] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Form States
    const [registerFormData, setRegisterFormData] = useState({
        firstName: '', lastName: '', age: '', gender: '', bloodGroup: '',
        contact: '', email: '', address: '', emergencyContact: '',
        allergies: '', chronicConditions: ''
    });
    const [registerVaccinations, setRegisterVaccinations] = useState([]);
    const [editFormData, setEditFormData] = useState(null);
    const [editVaccinations, setEditVaccinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [recentRegistrations, setRecentRegistrations] = useState([]);
    const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });
    const [error, setError] = useState(null);
    const [registrationError, setRegistrationError] = useState(null);


    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        if (!profile?.id) return;
        try {
            if (!isRefresh) setLoading(true);
            setError(null);
            const [registrationsData, statsData] = await Promise.all([
                staffService.getRecentRegistrations(profile.id),
                staffService.getStats(),
            ]);
            setRecentRegistrations(registrationsData);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);

    /**
     * Refreshes dashboard data selectively to improve responsiveness after mutations.
     */
    const refreshTabData = useCallback(async () => {
        if (!profile?.id) return;
        try {
            const [registrationsData, statsData] = await Promise.all([
                staffService.getRecentRegistrations(profile.id),
                staffService.getStats(),
            ]);
            setRecentRegistrations(registrationsData);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to refresh data', err);
        }
    }, [profile?.id]);

    useEffect(() => {
        if (profile?.id) fetchDashboardData();
    }, [profile?.id, fetchDashboardData]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setRegistrationError(null);
        try {
            if (!profile?.id) throw new Error("Staff session expired. Please refresh.");

            // Registration now handles medical info and vaccinations in one call
            const response = await patientService.registerPatient({
                ...registerFormData,
                vaccinations: registerVaccinations
            }, profile);

            setIsRegisterOpen(false);
            setSuccessState({
                isOpen: true,
                type: 'register',
                data: {
                    id: response.health_id ?? '—',
                    tempPassword: response.temp_password ?? null,
                },
            });
            setRegisterFormData({
                firstName: '', lastName: '', age: '', gender: '', bloodGroup: '',
                contact: '', email: '', address: '', emergencyContact: '',
                allergies: '', chronicConditions: ''
            });
            setRegisterVaccinations([]);
            refreshTabData();
        } catch (err) {
            console.error('Registration failed', err);
            const msg = err.message || '';
            if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
                setRegistrationError('This email is already registered with another account.');
            } else {
                setRegistrationError('Failed to register patient: ' + msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...editFormData,
                allergies: editFormData.allergies
                    ? (typeof editFormData.allergies === 'string'
                        ? editFormData.allergies.split(',').map(s => s.trim()).filter(Boolean)
                        : editFormData.allergies)
                    : [],
                chronicConditions: editFormData.chronicConditions
                    ? (typeof editFormData.chronicConditions === 'string'
                        ? editFormData.chronicConditions.split(',').map(s => s.trim()).filter(Boolean)
                        : editFormData.chronicConditions)
                    : [],
            };
            await patientService.updatePatient(selectedPatient.uuid, dataToSend);
            // Save vaccinations (replaces any existing ones)
            await patientService.updateVaccinations(selectedPatient.uuid, editVaccinations);
            setIsEditOpen(false);
            setSuccessState({ isOpen: true, type: 'edit', data: { name: editFormData.name } });
            setSelectedPatient(null);
            setEditFormData(null);
            setEditVaccinations([]);
            setSearchQuery('');
            refreshTabData();
        } catch (err) {
            console.error('Update failed', err);
            // More descriptive error for the user
            const msg = err.message || 'Unknown error';
            alert('Failed to update patient: ' + msg);
        }
    };

    const initiateEdit = async (patient) => {
        setSelectedPatient(patient);
        setEditFormData({
            ...patient,
            name: patient.name,
            bloodGroup: patient.bloodGroup || '',
            email: patient.email || '',
            address: patient.address || '',
            emergencyContact: patient.emergencyContact || '',
            allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : (patient.allergies || ''),
            chronicConditions: Array.isArray(patient.chronicConditions) ? patient.chronicConditions.join(', ') : (patient.chronicConditions || ''),
        });

        // Fetch complete details to get vaccinations and email/address specifically
        try {
            const details = await patientService.getPatientDetails(patient.id);
            if (details) {
                // Merge full details from server into form fields
                setEditFormData(prev => ({
                    ...prev,
                    email: details.profile?.email || prev.email || '',
                    address: details.profile?.address || prev.address || '',
                    bloodGroup: details.profile?.bloodGroup || prev.bloodGroup || '',
                    emergencyContact: details.profile?.emergencyContact || prev.emergencyContact || '',
                    allergies: Array.isArray(details.profile?.allergies) ? details.profile.allergies.join(', ') : (details.profile?.allergies || prev.allergies || ''),
                    chronicConditions: Array.isArray(details.profile?.chronicConditions) ? details.profile.chronicConditions.join(', ') : (details.profile?.chronicConditions || prev.chronicConditions || ''),
                }));

                if (Array.isArray(details.vaccinations)) {
                    setEditVaccinations(details.vaccinations.map(v => ({
                        name: v.name || '',
                        date: v.date || '',
                        nextDue: v.nextDue || ''
                    })));
                }
            }
        } catch (err) {
            console.error('Failed to fetch full details for edit', err);
            // No need to alert, we have partial data from the list
        }
    };

    const initiateDetails = async (patient) => {
        setViewingPatient(patient);
        setIsDetailsOpen(true);
        try {
            const details = await patientService.getPatientDetails(patient.id);
            if (details) {
                setViewingPatient(prev => ({
                    ...prev,
                    ...details,
                    name: details.name || prev.name,
                    contact: details.contact || prev.contact,
                }));
            }
        } catch (err) {
            console.error('Failed to fetch full details for view', err);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Sidebar */}
            <aside className={`w-80 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} h-full overflow-y-auto`}>
                <div className="p-6 border-b border-gray-100 mb-2 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-600 rounded-lg">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-tight text-lg">Staff Dashboard</h1>
                            <p className="text-xs text-gray-500">{profile?.full_name ?? 'Staff Member'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-4">
                    <div className="space-y-3">
                        <button
                            onClick={() => setIsRegisterOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
                        >
                            <UserPlus className="w-5 h-5" />
                            Register New Patient
                        </button>
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <Edit className="w-5 h-5 text-gray-500" />
                            Edit Patient Details
                        </button>
                    </div>

                    {/* Restricted Access Warning */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-6">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h4 className="font-bold text-red-900 text-sm">Medical Data Restricted</h4>
                        </div>
                        <p className="text-xs text-red-700 font-medium mb-2">Staff cannot access:</p>
                        <ul className="space-y-1.5">
                            {['Patient medical records', 'Medical history or diagnoses', 'Prescriptions or lab reports', 'Doctor notes or clinical data'].map((item, i) => (
                                <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Scope */}
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                        <h4 className="font-bold text-green-900 text-sm mb-1">Your Scope</h4>
                        <p className="text-xs text-green-700 mb-3 block">Patient Onboarding Only</p>
                        <ul className="space-y-2">
                            {['Register new patients', 'Generate Health IDs', 'Create login credentials', 'Update details'].map((item, i) => (
                                <li key={i} className="text-xs text-green-800 flex items-center gap-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-100 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 lg:ml-80 p-4 sm:p-8 w-full max-w-full overflow-hidden">
                {/* Mobile Top Bar */}
                <div className="lg:hidden flex items-center justify-between bg-white px-4 py-3 border-b border-gray-100 sticky top-0 z-30 mb-6 -mx-4 sm:-mx-8">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:text-green-600 transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-600 rounded">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">Health Portal</span>
                    </div>
                    <div className="w-10"></div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Today's Registrations</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.today}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <UserPlus className="w-6 h-6 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">This Week</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.week}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Activity className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">This Month</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.month}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <CheckSquare className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Your Registrations</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>



                {/* Recent Registrations Table */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Recent Registrations</h3>
                            <p className="text-sm text-gray-500">Patients registrations by staff</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center rounded-md border text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 bg-teal-50 text-teal-700 border-teal-200 px-3 py-1">
                                <Users className="w-3 h-3 mr-1" />
                                Staff
                            </span>
                            <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                Registration Data
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {loading ? (
                            <div className="p-6">
                                <TableSkeleton rows={8} cols={7} />
                            </div>
                        ) : recentRegistrations.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No registrations yet</p>
                                <p className="text-sm mt-1">Register your first patient using the button on the left</p>
                            </div>
                        ) : (
                            <table className="w-full relative min-w-[800px]">
                                <thead className="bg-gray-50 text-left sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Health ID</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Patient Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Age</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Gender</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Registration Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Registered By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentRegistrations.map((patient) => (
                                        <tr
                                            key={patient.uuid}
                                            className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                                            onClick={() => initiateDetails(patient)}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-blue-600">{patient.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-900 font-medium">{patient.name}</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {patient.allergies?.slice(0, 2).map((a, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
                                                                {a}
                                                            </span>
                                                        ))}
                                                        {patient.chronicConditions?.slice(0, 2).map((c, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100">
                                                                {c}
                                                            </span>
                                                        ))}
                                                        {(patient.allergies?.length > 2 || patient.chronicConditions?.length > 2) && (
                                                            <span className="text-[10px] text-gray-400 font-medium">+more</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{patient.age ?? '—'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{patient.gender}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{patient.contact}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{patient.date}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                                                    {patient.by}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isRegisterOpen}
                onClose={() => { setIsRegisterOpen(false); setRegisterVaccinations([]); setRegistrationError(null); }}
                title="Register New Patient"
            >
                <form className="space-y-4" onSubmit={handleRegister}>
                    <div className="overflow-y-auto max-h-[70vh] pr-1 space-y-4">
                        {registrationError && (
                            <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2 text-sm text-red-700">
                                <AlertTriangle className="w-4 h-4" />
                                {registrationError}
                            </div>
                        )}
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-2 text-sm text-green-800">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Fill patient details to generate Health ID and login credentials
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First Name *"
                                placeholder="John"
                                required
                                value={registerFormData.firstName}
                                onChange={(e) => setRegisterFormData({ ...registerFormData, firstName: e.target.value })}
                            />
                            <Input
                                label="Last Name *"
                                placeholder="Doe"
                                required
                                value={registerFormData.lastName}
                                onChange={(e) => setRegisterFormData({ ...registerFormData, lastName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="Age *"
                                placeholder="25"
                                type="number"
                                min="0"
                                max="120"
                                required
                                value={registerFormData.age}
                                onChange={(e) => setRegisterFormData({ ...registerFormData, age: e.target.value })}
                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Select
                                label="Gender *"
                                placeholder="Select"
                                options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]}
                                value={registerFormData.gender}
                                onChange={(val) => setRegisterFormData({ ...registerFormData, gender: val })}
                            />
                            <Select
                                label="Blood Group"
                                placeholder="Select"
                                options={[
                                    { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                                    { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                                    { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                                    { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }
                                ]}
                                value={registerFormData.bloodGroup}
                                onChange={(val) => setRegisterFormData({ ...registerFormData, bloodGroup: val })}
                            />
                        </div>

                        <Input
                            label="Contact Number *"
                            placeholder="+91 9876543210"
                            required
                            value={registerFormData.contact}
                            onChange={(e) => setRegisterFormData({ ...registerFormData, contact: e.target.value })}
                        />
                        <Input
                            label="Email Address"
                            placeholder="patient@email.com"
                            type="email"
                            value={registerFormData.email}
                            onChange={(e) => setRegisterFormData({ ...registerFormData, email: e.target.value })}
                        />
                        <Input
                            label="Address *"
                            placeholder="Full residential address"
                            required
                            value={registerFormData.address}
                            onChange={(e) => setRegisterFormData({ ...registerFormData, address: e.target.value })}
                        />
                        <Input
                            label="Emergency Contact *"
                            placeholder="Name and contact number"
                            required
                            value={registerFormData.emergencyContact}
                            onChange={(e) => setRegisterFormData({ ...registerFormData, emergencyContact: e.target.value })}
                        />

                        {/* Optional Medical Info */}
                        <div className="border-t border-gray-100 pt-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Optional Medical Info</p>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Known Allergies <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Penicillin, Peanuts"
                                        value={registerFormData.allergies}
                                        onChange={(e) => setRegisterFormData({ ...registerFormData, allergies: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Chronic Conditions <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Diabetes, Hypertension"
                                        value={registerFormData.chronicConditions}
                                        onChange={(e) => setRegisterFormData({ ...registerFormData, chronicConditions: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vaccinations */}
                        <div className="border-t border-gray-100 pt-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Syringe className="w-4 h-4 text-green-600" />
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vaccination History</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRegisterVaccinations([...registerVaccinations, { name: '', date: '', nextDue: '' }])}
                                    className="flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg border border-green-200 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Vaccination
                                </button>
                            </div>
                            {registerVaccinations.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-3">No vaccinations added yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {registerVaccinations.map((vac, i) => (
                                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-gray-500">Vaccination {i + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setRegisterVaccinations(registerVaccinations.filter((_, idx) => idx !== i))}
                                                    className="text-red-400 hover:text-red-600 p-0.5"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Vaccine name *"
                                                value={vac.name}
                                                onChange={(e) => setRegisterVaccinations(registerVaccinations.map((v, idx) => idx === i ? { ...v, name: e.target.value } : v))}
                                                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-0.5 block">Date Administered</label>
                                                    <input
                                                        type="date"
                                                        value={vac.date}
                                                        onChange={(e) => setRegisterVaccinations(registerVaccinations.map((v, idx) => idx === i ? { ...v, date: e.target.value } : v))}
                                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-0.5 block">Next Due Date</label>
                                                    <input
                                                        type="date"
                                                        min={today}
                                                        value={vac.nextDue}
                                                        onChange={(e) => setRegisterVaccinations(registerVaccinations.map((v, idx) => idx === i ? { ...v, nextDue: e.target.value } : v))}
                                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 mt-4 h-12 text-base">
                        <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Generate Health ID & Create Account
                        </div>
                    </Button>
                </form>
            </Modal>

            {/* Modal: Edit Patient Details */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => { setIsEditOpen(false); setSelectedPatient(null); setEditFormData(null); setSearchQuery(''); }}
                title="Edit Patient Details"
            >
                {!selectedPatient ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, Health ID, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                            />
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {searchQuery ? (
                                recentRegistrations
                                    .filter(p =>
                                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (p.id ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (p.contact ?? '').includes(searchQuery)
                                    )
                                    .map(patient => (
                                        <button
                                            key={patient.uuid}
                                            onClick={() => initiateEdit(patient)}
                                            className="w-full text-left p-4 rounded-xl border bg-white border-gray-100 hover:border-green-200 hover:shadow-sm group transition-all cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{patient.name}</h4>
                                                    <p className="text-xs text-gray-500">{patient.id} • {patient.contact}</p>
                                                </div>
                                                <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
                                                    Your Registration
                                                </span>
                                            </div>
                                        </button>
                                    ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Edit className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm">Search for a patient to edit their details</p>
                                    <p className="text-xs text-gray-400 mt-1">You can only edit patients you registered</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={handleEditSubmit}>
                        <div className="overflow-y-auto max-h-[60vh] pr-1 space-y-4">
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-green-600 font-medium">Editing: <span className="font-bold text-green-800">{selectedPatient.name}</span></p>
                                    <p className="text-[10px] text-green-600">{selectedPatient.id}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedPatient(null); setEditFormData(null); setEditVaccinations([]); }}
                                    className="text-xs font-bold text-green-700 hover:text-green-800 underline cursor-pointer"
                                >
                                    Change Patient
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Full Name *"
                                    value={editFormData?.name || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Age *"
                                    value={editFormData?.age || ''}
                                    type="number"
                                    onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Gender *"
                                    value={editFormData?.gender || ''}
                                    options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]}
                                    onChange={(val) => setEditFormData({ ...editFormData, gender: val })}
                                />
                                <Select
                                    label="Blood Group"
                                    placeholder="Select"
                                    value={editFormData?.bloodGroup || ''}
                                    options={[
                                        { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                                        { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                                        { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                                        { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }
                                    ]}
                                    onChange={(val) => setEditFormData({ ...editFormData, bloodGroup: val })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Contact Number *"
                                    value={editFormData?.contact || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Email Address"
                                    value={editFormData?.email || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    type="email"
                                />
                            </div>

                            <Input
                                label="Address *"
                                value={editFormData?.address || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                required
                            />
                            <Input
                                label="Emergency Contact *"
                                value={editFormData?.emergencyContact || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                                required
                            />

                            {/* Optional Medical Info */}
                            <div className="border-t border-gray-100 pt-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Optional Medical Info</p>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Known Allergies <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Penicillin, Peanuts"
                                            value={editFormData?.allergies || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, allergies: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Chronic Conditions <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Diabetes, Hypertension"
                                            value={editFormData?.chronicConditions || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, chronicConditions: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Vaccination History */}
                            <div className="border-t border-gray-100 pt-3">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Syringe className="w-4 h-4 text-green-600" />
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vaccination History</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditVaccinations([...editVaccinations, { name: '', date: '', nextDue: '' }])}
                                        className="flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg border border-green-200 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Vaccination
                                    </button>
                                </div>
                                {editVaccinations.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-3">No vaccinations recorded</p>
                                ) : (
                                    <div className="space-y-3">
                                        {editVaccinations.map((vac, i) => (
                                            <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-gray-500">Vaccination {i + 1}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditVaccinations(editVaccinations.filter((_, idx) => idx !== i))}
                                                        className="text-red-400 hover:text-red-600 p-0.5"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Vaccine name *"
                                                    value={vac.name}
                                                    onChange={(e) => setEditVaccinations(editVaccinations.map((v, idx) => idx === i ? { ...v, name: e.target.value } : v))}
                                                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-0.5 block">Date Administered</label>
                                                        <input
                                                            type="date"
                                                            value={vac.date}
                                                            onChange={(e) => setEditVaccinations(editVaccinations.map((v, idx) => idx === i ? { ...v, date: e.target.value } : v))}
                                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-0.5 block">Next Due Date</label>
                                                        <input
                                                            type="date"
                                                            min={today}
                                                            value={vac.nextDue}
                                                            onChange={(e) => setEditVaccinations(editVaccinations.map((v, idx) => idx === i ? { ...v, nextDue: e.target.value } : v))}
                                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg border border-blue-100">
                                Patient details will be updated in the system.
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-11 mt-4">
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Update Patient Details
                            </div>
                        </Button>
                    </form>
                )}
            </Modal>

            {/* Modal: Patient Details (Read-only) */}
            <Modal
                isOpen={isDetailsOpen}
                onClose={() => { setIsDetailsOpen(false); setViewingPatient(null); }}
                title="Patient Details"
            >
                {viewingPatient && (
                    <div className="space-y-6 overflow-y-auto max-h-[80vh] pr-2">
                        <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl border border-green-100">
                            <div>
                                <h4 className="text-xl font-bold text-green-900">{viewingPatient.name}</h4>
                                <p className="text-sm font-medium text-green-700">{viewingPatient.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Member Since</p>
                                <p className="text-sm font-bold text-green-800">{viewingPatient.date}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase">Age & Gender</p>
                                <p className="text-gray-900 font-medium">{viewingPatient.age || '—'} years • {viewingPatient.gender}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase">Blood Group</p>
                                <p className="text-gray-900 font-medium">{viewingPatient.bloodGroup || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase">Contact Number</p>
                                <p className="text-gray-900 font-medium">{viewingPatient.contact}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase">Email Address</p>
                                <p className="text-gray-900 font-medium break-all">{viewingPatient.email || '—'}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 uppercase">Address</p>
                            <p className="text-gray-900 font-medium">{viewingPatient.address || '—'}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 uppercase">Emergency Contact</p>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 italic text-gray-700">
                                {viewingPatient.emergencyContact || '—'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase">Allergies</p>
                                <div className="flex flex-wrap gap-1">
                                    {viewingPatient.allergies && viewingPatient.allergies.length > 0 ? (
                                        viewingPatient.allergies.map((a, i) => (
                                            <span key={i} className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                                                {a}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400">None recorded</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase">Chronic Conditions</p>
                                <div className="flex flex-wrap gap-1">
                                    {viewingPatient.chronicConditions && viewingPatient.chronicConditions.length > 0 ? (
                                        viewingPatient.chronicConditions.map((c, i) => (
                                            <span key={i} className="px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
                                                {c}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400">None recorded</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Syringe className="w-4 h-4 text-green-600" />
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vaccination History</p>
                            </div>
                            {viewingPatient.vaccinations && viewingPatient.vaccinations.length > 0 ? (
                                <div className="space-y-2">
                                    {viewingPatient.vaccinations.map((vac, i) => (
                                        <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{vac.name}</p>
                                                <p className="text-xs text-gray-500">Administered: {vac.displayDate || '—'}</p>
                                            </div>
                                            {vac.nextDue && (
                                                <div className="text-right">
                                                    <p className="text-[10px] text-orange-600 font-bold uppercase">Next Due</p>
                                                    <p className="text-xs font-semibold text-orange-700">{vac.displayNextDue}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-2 italic">No vaccination records found</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Success */}
            {successState.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-slide-up text-center relative">
                        <button
                            onClick={() => setSuccessState({ ...successState, isOpen: false })}
                            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <h3 className="text-lg font-bold text-gray-900 mb-6">
                            {successState.type === 'register' ? 'Patient Registration Successful' : 'Update Successful'}
                        </h3>

                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>

                        <h4 className="text-lg font-medium text-gray-900 mb-4">
                            {successState.type === 'register' ? 'Patient Successfully Registered!' : 'Patient Details Updated!'}
                        </h4>

                        {successState.type === 'register' && (
                            <>
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-3">
                                    <p className="text-sm text-blue-600 font-medium mb-1">Generated Health ID:</p>
                                    <p className="text-2xl font-bold text-blue-800">{successState.data?.id}</p>
                                </div>
                                {successState.data?.tempPassword && (
                                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-3">
                                        <p className="text-sm text-yellow-700 font-medium mb-1">Temporary Password:</p>
                                        <p className="text-lg font-mono font-bold text-yellow-900">{successState.data.tempPassword}</p>
                                        <p className="text-xs text-yellow-600 mt-1">Share this with the patient — they can change it using forgot password.</p>
                                    </div>
                                )}
                            </>
                        )}

                        {successState.type === 'edit' && (
                            <p className="text-sm text-gray-500 mb-6">
                                The details for <span className="font-semibold text-gray-900">{successState.data?.name}</span> have been successfully updated.
                            </p>
                        )}

                        <Button
                            onClick={() => setSuccessState({ ...successState, isOpen: false })}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
