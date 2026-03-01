import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Stethoscope,
    Plus,
    Lock,
    AlertTriangle,
    Shield,
    CheckCircle,
    FileText,
    Pill,
    Activity,
    LogOut,
    Eye,
    X,
    Calendar,
    Loader,
    Syringe,
    User
} from 'lucide-react';
import { patientService, doctorService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const { profile, signOut } = useAuth();

    const [searchValue, setSearchValue] = useState('');
    const [patient, setPatient] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const [activeTab, setActiveTab] = useState('visits');
    const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [visitForm, setVisitForm] = useState({
        diagnosis: '',
        prescription: '',
        notes: '',
        nextVisit: '',
    });

    const handleSearch = async () => {
        if (!searchValue.trim()) return;
        setSearching(true);
        setSearchError(null);
        setPatient(null);

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Search timed out. Please try again.')), 10000)
        );

        try {
            const data = await Promise.race([
                patientService.getPatientDetails(searchValue.trim()),
                timeoutPromise
            ]);
            setPatient(data);
        } catch (err) {
            console.error('Search error', err);
            setSearchError(err.message ?? 'Patient not found');
        } finally {
            setSearching(false);
        }
    };

    const handleAddVisit = async (e) => {
        e.preventDefault();
        if (!patient) return;
        setIsSubmitting(true);
        try {
            await doctorService.addVisit({
                patientId: patient.uuid,
                diagnosis: visitForm.diagnosis,
                prescription: visitForm.prescription,
                notes: visitForm.notes,
                nextVisit: visitForm.nextVisit,
                doctorId: profile.id,
                hospitalId: profile.hospital_id,
            });
            setIsVisitModalOpen(false);
            setVisitForm({ diagnosis: '', prescription: '', notes: '', nextVisit: '' });
            // Refresh patient data
            const updated = await patientService.getPatientDetails(searchValue.trim());
            setPatient(updated);
        } catch (err) {
            console.error('Failed to add visit', err);
            alert('Failed to add visit: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 text-lg leading-tight">Doctor Dashboard</h1>
                            <p className="text-xs text-gray-500">{profile?.full_name ?? 'Doctor'}</p>
                        </div>
                    </div>

                    {/* Quick patient search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Health ID..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-4">
                    {/* Doctor info */}
                    {profile && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-700" />
                                </div>
                                <div>
                                    <p className="font-bold text-blue-900 text-sm">{profile.full_name}</p>
                                    <p className="text-xs text-blue-600">{profile.specialization ?? 'General Practice'}</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wider">Doctor • Active</p>
                        </div>
                    )}

                    {/* Restrictions */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Lock className="w-5 h-5 text-red-600" />
                            <h4 className="font-bold text-red-900 text-sm">Immutable Records</h4>
                        </div>
                        <ul className="space-y-1.5">
                            {['All visits are append-only', 'No editing previous records', 'No patient deletion allowed', 'Audit trail maintained'].map((item, i) => (
                                <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Scope */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h4 className="font-bold text-blue-900 text-sm mb-1">Your Scope</h4>
                        <p className="text-xs text-blue-700 mb-3 block">Medical Data Creation</p>
                        <ul className="space-y-2">
                            {['Search patients by Health ID', 'Add new visit records', 'View patient medical history', 'Upload lab reports'].map((item, i) => (
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

                {/* Search Bar */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Patient Lookup</h2>
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                            <Shield className="w-3 h-3" />
                            DOCTOR
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Enter Patient Health ID (e.g. HLTH-2024-001234)…"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full
        h-12
        pl-9
        pr-4
        bg-gray-50
        border
        border-gray-200
        rounded-lg
        text-sm
        focus:outline-none
        focus:ring-2
        focus:ring-blue-100
        focus:border-blue-500
        transition"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={searching}
                            className="bg-blue-100 hover:bg-blue-200 px-1 h-12 flex items-center gap-2"
                        >
                            {searching ? (
                                <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                            {searching ? 'Searching…' : 'Search Patient'}
                        </Button>
                    </div>

                    {searchError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-700">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {searchError}
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {!patient && !searching && !searchError && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Search for a Patient</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Enter a patient's Health ID to view their complete medical history, visit records, prescriptions, and lab reports.
                        </p>
                    </div>
                )}

                {/* Searching spinner */}
                {searching && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center">
                        <Loader className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Looking up patient records…</p>
                    </div>
                )}

                {/* Patient Card + Tabs */}
                {patient && (
                    <>
                        {/* Patient Header */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                                        <span className="text-xl font-bold text-white">{patient.name?.charAt(0) ?? '?'}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
                                        <div className="flex flex-wrap gap-3 mt-1">
                                            <span className="text-sm text-gray-500">
                                                <span className="font-bold text-blue-600">{patient.id}</span>
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-sm text-gray-500">{patient.age} yrs • {patient.gender} • {patient.bloodGroup}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">{patient.contact}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <Button
                                        onClick={() => setIsVisitModalOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add New Visit
                                    </Button>
                                    <button
                                        onClick={() => setPatient(null)}
                                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" />Clear
                                    </button>
                                </div>
                            </div>

                            {/* Alerts / Profile Summary */}
                            <div className="mt-4 flex flex-wrap gap-3">
                                <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                    <span className="text-sm text-red-700">
                                        <strong>Allergies:</strong> {patient.allergies?.length > 0 ? patient.allergies.join(', ') : 'None Reported'}
                                    </span>
                                </div>
                                <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-orange-500 shrink-0" />
                                    <span className="text-sm text-orange-700">
                                        <strong>Conditions:</strong> {patient.chronicConditions?.length > 0 ? patient.chronicConditions.join(', ') : 'None Reported'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
                            {[
                                { id: 'visits', label: 'Visit History', icon: Activity },
                                { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
                                { id: 'labs', label: 'Lab Reports', icon: FileText },
                                { id: 'vaccinations', label: 'Vaccinations', icon: Syringe },
                            ].map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                                        {id === 'visits'
                                            ? patient.visits?.length
                                            : id === 'prescriptions'
                                                ? (patient.visits?.filter(v => v.prescription)?.length ?? 0)
                                                : id === 'labs'
                                                    ? patient.labReports?.length
                                                    : patient.vaccinations?.length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Visits Tab */}
                        {activeTab === 'visits' && (
                            <div className="space-y-4">
                                {patient.visits?.length === 0 ? (
                                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                                        <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p>No visit records yet. Add the first visit using the button above.</p>
                                    </div>
                                ) : (
                                    patient.visits.map((visit, idx) => (
                                        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                        <Activity className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{visit.date}</p>
                                                        <p className="text-xs text-gray-500">Dr. {visit.doctor} • {visit.specialty}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-1 rounded tracking-wider">
                                                    #{visit.id}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="md:col-span-1">
                                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Diagnosis</p>
                                                    <p className="text-sm font-medium text-gray-800">{visit.diagnosis}</p>
                                                </div>
                                                {visit.prescription && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Prescription</p>
                                                        <p className="text-sm text-gray-700">{visit.prescription}</p>
                                                    </div>
                                                )}
                                                {visit.notes && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Clinical Notes</p>
                                                        <p className="text-sm text-gray-700 italic">{visit.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-orange-600">
                                                <Lock className="w-3 h-3" />
                                                Immutable — record cannot be edited or deleted
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Prescriptions Tab — sourced from visit records */}
                        {activeTab === 'prescriptions' && (() => {
                            const visitPrescriptions = (patient.visits ?? []).filter(v => v.prescription);
                            return (
                                <div className="space-y-4">
                                    {visitPrescriptions.length === 0 ? (
                                        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                                            <Pill className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                            <p>No prescriptions yet. Add a visit with prescription notes.</p>
                                        </div>
                                    ) : (
                                        visitPrescriptions.map((v, i) => (
                                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                            <Pill className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm">Visit on {v.date}</p>
                                                            <p className="text-xs text-gray-500">Dr. {v.doctor}{v.specialty ? ` · ${v.specialty}` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-0.5 rounded tracking-wider">#{v.id}</span>
                                                </div>
                                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                                                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Prescription Notes</p>
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{v.prescription}</p>
                                                </div>
                                                <div className="mt-3 flex items-center gap-1.5 text-xs text-orange-600">
                                                    <Lock className="w-3 h-3" />
                                                    Immutable — record cannot be edited or deleted
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            );
                        })()}

                        {/* Vaccinations Tab */}
                        {activeTab === 'vaccinations' && (
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                {patient.vaccinations?.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400">
                                        <Syringe className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p>No vaccination records found.</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vaccine</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Administered</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Next Due</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {patient.vaccinations.map((v, i) => {
                                                const isDue = v.nextDue !== '—' && new Date(v.nextDue) < new Date();
                                                return (
                                                    <tr key={i} className="hover:bg-gray-50/50">
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.name}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">{v.date}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {v.nextDue}
                                                            {isDue && (
                                                                <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">OVERDUE</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isDue ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                                <CheckCircle className="w-3 h-3" />
                                                                {isDue ? 'Due' : 'Completed'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                        {activeTab === 'labs' && (
                            <div className="space-y-4">
                                {patient.labReports?.length === 0 ? (
                                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p>No lab reports yet.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Report Name</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Hospital</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">File</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {patient.labReports.map((r, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50">
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.name}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{r.date}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{r.hospital}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === 'Normal' ? 'bg-green-50 text-green-700' : r.status === 'Abnormal' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                                                {r.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                                                                <FileText className="w-3.5 h-3.5" />View
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modal: Add New Visit */}
            <Modal
                isOpen={isVisitModalOpen}
                onClose={() => setIsVisitModalOpen(false)}
                title="Add New Visit Record"
            >
                <form className="space-y-4" onSubmit={handleAddVisit}>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2 text-xs text-orange-700 mb-2">
                        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>This record will be <strong>permanent and immutable</strong>. Double-check all information before submitting.</span>
                    </div>

                    <Input
                        label="Primary Diagnosis *"
                        placeholder="e.g. Hypertension Stage 2"
                        required
                        value={visitForm.diagnosis}
                        onChange={(e) => setVisitForm({ ...visitForm, diagnosis: e.target.value })}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Prescription</label>
                        <textarea
                            placeholder="List medications and dosages..."
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 h-20"
                            value={visitForm.prescription}
                            onChange={(e) => setVisitForm({ ...visitForm, prescription: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Clinical Notes</label>
                        <textarea
                            placeholder="Observations, follow-up instructions, etc."
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 h-20"
                            value={visitForm.notes}
                            onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Calendar className="w-4 h-4 inline mr-1" />Next Visit Date
                        </label>
                        <input
                            type="date"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50"
                            value={visitForm.nextVisit}
                            onChange={(e) => setVisitForm({ ...visitForm, nextVisit: e.target.value })}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-11"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2"><Loader className="w-4 h-4 animate-spin" />Saving Visit…</span>
                        ) : (
                            <span className="flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" />Confirm & Save Visit</span>
                        )}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
