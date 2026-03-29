import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    Download,
    Shield,
    Lock,
    AlertTriangle,
    Eye,
    FileText,
    Pill,
    Syringe,
    Calendar,
    User,
    Phone,
    MapPin,
    HeartPulse,
    Menu,
    X,
    ChevronRight,
    Search,
    Filter,
    ArrowUpDown,
    ShieldCheck,
    Layout,
    History,
    Loader2 as Loader,
    CheckCircle,
    LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { patientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/shared/TableSkeleton';

const VisitHistory = React.memo(({ visits, isPrescriptionView = false }) => {
    const data = isPrescriptionView ? (visits ?? []).filter(v => v.prescription) : visits;

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 shadow-sm transition-all duration-300 animate-in fade-in zoom-in-95">
                {isPrescriptionView ? <Pill className="w-10 h-10 mx-auto mb-3 opacity-30" /> : <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />}
                <p className="font-medium">No {isPrescriptionView ? 'prescriptions' : 'visits'} on record yet</p>
                {isPrescriptionView && <p className="text-sm mt-1">Prescriptions are added by your doctor during visits</p>}
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {data.map((v, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPrescriptionView ? 'bg-indigo-50' : 'bg-teal-50'}`}>
                                {isPrescriptionView ? <Pill className={`w-5 h-5 text-indigo-600`} /> : <Activity className={`w-5 h-5 text-teal-600`} />}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Visit on {v.date}</p>
                                <p className="text-xs text-gray-500">Dr. {v.doctor} {v.specialty && `• ${v.specialty}`}</p>
                                {v.hospital && <p className="text-xs text-gray-400">{v.hospital}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-0.5 rounded tracking-wider">#{v.id}</span>
                        </div>
                    </div>
                    {isPrescriptionView ? (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Prescription Notes</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{v.prescription}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Diagnosis</p>
                                <p className="text-sm font-medium text-gray-800">{v.diagnosis}</p>
                            </div>
                            {v.prescription && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Prescription</p>
                                    <p className="text-sm text-gray-700 truncate">{v.prescription}</p>
                                </div>
                            )}
                            {v.notes && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Doctor's Notes</p>
                                    <p className="text-sm text-gray-700 italic">{v.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    {!isPrescriptionView && (
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-400">View-only — records are immutable for your protection</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
});

const LabReports = React.memo(({ labReports }) => {
    if (!labReports || labReports.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 shadow-sm animate-in fade-in zoom-in-95">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No lab reports on record yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-auto">
            <table className="w-full min-w-[600px]">
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
                    {labReports.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{r.date}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{r.hospital}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === 'Normal' ? 'bg-green-50 text-green-700' : r.status === 'Abnormal' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                    {r.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <a
                                    href={r.url}
                                    download={r.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold transition-colors group"
                                >
                                    <Download className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    Download
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

const Vaccinations = React.memo(({ vaccinations }) => {
    if (!vaccinations || vaccinations.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 shadow-sm animate-in fade-in zoom-in-95">
                <Syringe className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No vaccination records found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-auto">
            <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vaccine</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Administered</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Next Due</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {vaccinations.map((v, i) => {
                        const isOverdue = v.nextDue && new Date(v.nextDue) < new Date();
                        const isUpcoming = v.nextDue && new Date(v.nextDue) >= new Date();
                        return (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{v.date}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {v.nextDue}
                                    {isDue && (
                                        <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded animate-pulse">OVERDUE</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-50 text-red-700' : isUpcoming ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                                        {isOverdue ? (
                                            <AlertTriangle className="w-3 h-3" />
                                        ) : isUpcoming ? (
                                            <Calendar className="w-3 h-3 text-amber-600" />
                                        ) : (
                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                        )}
                                        {isOverdue ? 'Overdue' : isUpcoming ? 'Not Completed' : 'Completed'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
});

export default function PatientDashboard() {
    const navigate = useNavigate();
    const { profile, signOut } = useAuth();

    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabLoading, setTabLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('visits');
    const [loadedTabs, setLoadedTabs] = useState(new Set());


    const fetchPatientInitialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Only fetch profile and visits initially to speed up TTI
            const data = await patientService.getPatientDetailsByUUID(profile.id, 'profile,visits');

            setPatient(data.profile);
            if (data.visits) {
                setPatient(prev => ({ ...prev, visits: data.visits }));
                setLoadedTabs(new Set(['visits']));
            }
        } catch (err) {
            console.error('[DEBUG] fetchPatientInitialData: Failed', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);

    const fetchTabData = useCallback(async (tab) => {
        if (!patient?.id) return;

        // Map tab IDs to API include keys
        const tabMap = {
            'visits': 'visits',
            'prescriptions': 'visits', // Prescriptions are derived from visits
            'labs': 'lab_reports',
            'vaccinations': 'vaccinations'
        };

        const includeKey = tabMap[tab];
        if (!includeKey) return;

        try {
            setTabLoading(true);
            const data = await patientService.getPatientDetailsByUUID(profile.id, includeKey);

            setPatient(prev => ({
                ...prev,
                visits: includeKey === 'visits' ? data.visits : prev.visits,
                labReports: includeKey === 'lab_reports' ? data.labReports : prev.labReports,
                vaccinations: includeKey === 'vaccinations' ? data.vaccinations : prev.vaccinations,
            }));

            setLoadedTabs(prev => new Set([...prev, tab]));
        } catch (err) {
            console.error(`[DEBUG] fetchTabData (${tab}): Failed`, err);
        } finally {
            setTabLoading(false);
        }
    }, [patient?.id, profile?.id]);

    useEffect(() => {
        if (profile?.id) {
            fetchPatientInitialData();
        }
    }, [profile?.id, fetchPatientInitialData]);

    useEffect(() => {
        if (patient?.id && !loadedTabs.has(activeTab)) {
            fetchTabData(activeTab);
        }
    }, [activeTab, patient?.id, loadedTabs, fetchTabData]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    // Logout handler

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white border border-red-200 rounded-xl p-8 max-w-md">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Could not load records</h3>
                    <p className="text-sm text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchPatientInitialData}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium text-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Sidebar */}
            <aside className={`w-80 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} h-full overflow-y-auto`}>
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-teal-600 rounded-lg">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 text-lg leading-tight">My Health Records</h1>
                            <p className="text-xs text-gray-500">Patient Portal</p>
                        </div>
                    </div>

                    {/* Patient profile card */}
                    {patient && (
                        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0">
                                    <span className="text-lg font-bold text-white">{patient.name?.charAt(0)}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-teal-900">{patient.name}</p>
                                    <p className="text-xs text-teal-600 font-mono">{patient.id}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Age', value: `${patient.age} yrs` },
                                    { label: 'Gender', value: patient.gender },
                                    { label: 'Blood', value: patient.bloodGroup },
                                ].map(({ label, value }) => (
                                    <div key={label} className="text-center bg-white rounded-lg p-2">
                                        <p className="text-[10px] text-gray-400 uppercase">{label}</p>
                                        <p className="text-sm font-bold text-gray-800">{value ?? '—'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-4 py-4 space-y-3">
                    {/* Contact */}
                    {patient && (
                        <div className="space-y-2">
                            {patient.contact && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                    {patient.contact}
                                </div>
                            )}
                            {patient.address && (
                                <div className="flex items-start gap-2 text-sm text-gray-500">
                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    {patient.address}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Alerts / Health Summary */}
                    {patient && (
                        <div className="space-y-2">
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <h4 className="font-bold text-red-900 text-xs">Known Allergies</h4>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {patient.allergies?.length > 0 ? (
                                        patient.allergies.map((a, i) => (
                                            <span key={i} className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{a}</span>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-red-400 italic">None Reported</span>
                                    )}
                                </div>
                            </div>
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <HeartPulse className="w-4 h-4 text-orange-600" />
                                    <h4 className="font-bold text-orange-900 text-xs">Chronic Conditions</h4>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {patient.chronicConditions?.length > 0 ? (
                                        patient.chronicConditions.map((c, i) => (
                                            <span key={i} className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{c}</span>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-orange-400 italic">None Reported</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Read-only notice */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-blue-600" />
                            <h4 className="font-bold text-blue-900 text-xs">Read-Only Access</h4>
                        </div>
                        <p className="text-[11px] text-blue-700">You have full transparency into your health records. Changes can only be made by your healthcare provider.</p>
                    </div>

                    {/* Scope */}
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                        <h4 className="font-bold text-teal-900 text-xs mb-1">Patient Access</h4>
                        <p className="text-[11px] text-teal-700 mb-2">Complete Transparency into your own records</p>
                        <ul className="space-y-1.5">
                            {['View all visit history', 'Download prescriptions', 'Access lab reports', 'Track vaccinations'].map((item, i) => (
                                <li key={i} className="text-[11px] text-teal-800 flex items-center gap-1.5">
                                    <CheckCircle className="w-3 h-3 text-teal-600" />
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
                        className="p-2 -ml-2 text-gray-600 hover:text-teal-600 transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-teal-600 rounded">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">Patient Dashboard</span>
                    </div>
                    <div className="w-10"></div>
                </div>

                {/* Patient Header Banner */}
                {patient && (
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-4 sm:p-6 mb-6 text-white shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-2xl font-bold">{patient.name?.charAt(0)}</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{patient.name}</h2>
                                    <p className="text-teal-100 text-sm font-mono">{patient.id}</p>
                                    <p className="text-teal-200 text-xs mt-0.5">Member since {patient.memberSince}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                                <Shield className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold tracking-wider">Patient</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex items-center gap-4 min-w-max">
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                            {[
                                { id: 'visits', label: 'Visit History', icon: History },
                                { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
                                { id: 'labs', label: 'Lab Reports', icon: FileText },
                                { id: 'vaccinations', label: 'Vaccinations', icon: Syringe },
                            ].map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                        {tabLoading && (
                            <div className="flex items-center gap-2 text-teal-600 animate-pulse">
                                <Loader className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-medium">Updating...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="space-y-4">
                            {activeTab === 'visits' || activeTab === 'prescriptions' ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 h-32 animate-pulse" />
                                ))
                            ) : (
                                <TableSkeleton rows={8} cols={5} />
                            )}
                        </div>
                    ) : (
                        <>
                            {activeTab === 'visits' && <VisitHistory visits={patient?.visits} />}
                            {activeTab === 'prescriptions' && <VisitHistory visits={patient?.visits} isPrescriptionView />}
                            {activeTab === 'labs' && (
                                tabLoading && !patient?.labReports ? <TableSkeleton rows={8} cols={5} /> : <LabReports labReports={patient?.labReports} />
                            )}
                            {activeTab === 'vaccinations' && (
                                tabLoading && !patient?.vaccinations ? <TableSkeleton rows={8} cols={4} /> : <Vaccinations vaccinations={patient?.vaccinations} />
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
