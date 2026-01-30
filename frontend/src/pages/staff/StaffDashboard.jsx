import React, { useState } from 'react';
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
    X
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';

export default function StaffDashboard() {
    const navigate = useNavigate();
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [successState, setSuccessState] = useState({ isOpen: false, type: '', data: null });
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form States
    const [registerFormData, setRegisterFormData] = useState({
        firstName: '', lastName: '', age: '', gender: '', bloodGroup: '',
        contact: '', email: '', address: '', emergencyContact: ''
    });
    const [editFormData, setEditFormData] = useState(null);

    // Mock Data
    const recentRegistrations = [
        { id: 'HID123456', name: 'John Anderson', age: 45, gender: 'Male', contact: '+1 555-0101', date: '2026-01-02', by: 'Staff (You)' },
        { id: 'HID123457', name: 'Sarah Williams', age: 32, gender: 'Female', contact: '+1 555-0102', date: '2026-01-02', by: 'Staff (You)' },
        { id: 'HID123458', name: 'Michael Brown', age: 58, gender: 'Male', contact: '+1 555-0103', date: '2026-01-01', by: 'Staff (Carol M.)' },
        { id: 'HID123459', name: 'Emily Davis', age: 28, gender: 'Female', contact: '+1 555-0104', date: '2026-01-01', by: 'Staff (You)' },
        { id: 'HID123460', name: 'David Martinez', age: 51, gender: 'Male', contact: '+1 555-0105', date: '2025-12-31', by: 'Staff (James K.)' },
    ];

    const handleLogout = () => {
        navigate('/login');
    };

    const handleRegister = (e) => {
        e.preventDefault();
        setIsRegisterOpen(false);
        // Simulate ID generation
        const newId = `HID${Math.floor(100000 + Math.random() * 900000)}`;
        setSuccessState({ isOpen: true, type: 'register', data: { id: newId } });
        // Reset form
        setRegisterFormData({
            firstName: '', lastName: '', age: '', gender: '', bloodGroup: '',
            contact: '', email: '', address: '', emergencyContact: ''
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setIsEditOpen(false);
        setSuccessState({ isOpen: true, type: 'edit', data: { name: editFormData.name } });
        setSelectedPatient(null);
        setEditFormData(null);
    };

    const initiateEdit = (patient) => {
        setSelectedPatient(patient);
        setEditFormData({
            ...patient,
            firstName: patient.name.split(' ')[0],
            lastName: patient.name.split(' ').slice(1).join(' '),
            bloodGroup: 'O+', // Default for mock
            email: 'patient@email.com', // Default for mock
            address: '123 Oak Street', // Default for mock
            emergencyContact: 'Jane Doe - +1 555-0199' // Default for mock
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 overflow-y-auto">
                <div className="p-6 border-b border-gray-100 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-600 rounded-lg">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-tight text-lg">Staff Dashboard</h1>
                            <p className="text-xs text-gray-500">Patient Registration</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-4">
                    <div className="space-y-3">
                        <button
                            onClick={() => setIsRegisterOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                        >
                            <UserPlus className="w-5 h-5" />
                            Register New Patient
                        </button>
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
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
                            {['Register new patients', 'Generate Health IDs', 'Create login credentials', 'Update contact details'].map((item, i) => (
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
                            <p className="text-sm font-medium text-gray-500 mb-1">Today's Registrations</p>
                            <h3 className="text-3xl font-bold text-gray-900">8</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <UserPlus className="w-6 h-6 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">This Week</p>
                            <h3 className="text-3xl font-bold text-gray-900">52</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Activity className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">This Month</p>
                            <h3 className="text-3xl font-bold text-gray-900">218</h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <CheckSquare className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Your Registrations</p>
                            <h3 className="text-3xl font-bold text-gray-900">145</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                {/* Guidelines Section */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
                    <h3 className="font-bold text-blue-900 text-lg mb-4">Patient Registration Guidelines</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex gap-3 mb-4">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Unique Health ID</h4>
                                    <p className="text-xs text-gray-600">Each patient receives a lifetime unique identifier</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Auto-Generated Login</h4>
                                    <p className="text-xs text-gray-600">Credentials sent to patient automatically</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex gap-3 mb-4">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Verify Identity</h4>
                                    <p className="text-xs text-gray-600">Confirm patient identity before registration</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">No Medical Access</h4>
                                    <p className="text-xs text-gray-600">Staff cannot view/edit medical records</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Registrations Table */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Recent Registrations</h3>
                            <p className="text-sm text-gray-500">Recently registered patients (contact information only)</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center rounded-md border text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 bg-teal-50 text-teal-700 border-teal-200 px-3 py-1">
                                <Users className="w-3 h-3 mr-1" />
                                STAFF ACCESS
                            </span>
                            <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                Registration Data Only
                            </div>
                        </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full relative">
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
                                    <tr key={patient.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 text-sm font-medium text-blue-600">{patient.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{patient.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{patient.age}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{patient.gender}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{patient.contact}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{patient.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${patient.by === 'Staff (You)' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                                                }`}>
                                                {patient.by}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal: Register New Patient */}
            <Modal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                title="Register New Patient"
            >
                <form className="space-y-4" onSubmit={handleRegister}>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-2 text-sm text-green-800 mb-4">
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
                            steps="1"
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
                        placeholder="+1 555-0100"
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

                        <div className="flex items-center gap-2 text-xs text-orange-600 font-medium px-1">
                            <AlertTriangle className="w-4 h-4" />
                            You can only edit patients registered by you
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {searchQuery ? (
                                recentRegistrations
                                    .filter(p =>
                                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        p.id.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map(patient => (
                                        <button
                                            key={patient.id}
                                            onClick={() => initiateEdit(patient)}
                                            disabled={patient.by !== 'Staff (You)'}
                                            className={`w-full text-left p-4 rounded-xl border transition-all ${patient.by === 'Staff (You)'
                                                ? 'bg-white border-gray-100 hover:border-green-200 hover:shadow-sm group'
                                                : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{patient.name}</h4>
                                                    <p className="text-xs text-gray-500">{patient.id} • {patient.contact}</p>
                                                </div>
                                                {patient.by === 'Staff (You)' && (
                                                    <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
                                                        Your Registration
                                                    </span>
                                                )}
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
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between mb-2">
                            <div>
                                <p className="text-xs text-green-600 font-medium">Editing: <span className="font-bold text-green-800">{selectedPatient.name}</span></p>
                                <p className="text-[10px] text-green-600">{selectedPatient.id}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setSelectedPatient(null); setEditFormData(null); }}
                                className="text-xs font-bold text-green-700 hover:text-green-800 underline"
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

                        <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg border border-blue-100">
                            Patient details will be updated in the system.
                        </div>

                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-11">
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Update Patient Details
                            </div>
                        </Button>
                    </form>
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
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-blue-600 font-medium mb-1">Generated Health ID:</p>
                                    <p className="text-2xl font-bold text-blue-800">{successState.data?.id}</p>
                                </div>
                                <p className="text-sm text-gray-500 mb-6">
                                    Login credentials have been auto-generated and sent to the patient's email/phone.
                                </p>
                            </>
                        )}

                        {successState.type === 'edit' && (
                            <p className="text-sm text-gray-500 mb-6">
                                The details for <span className="font-semibold text-gray-900">{successState.data?.name}</span> have been successfully updated in the system.
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
