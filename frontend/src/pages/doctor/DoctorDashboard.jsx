import React, { useState, useEffect, useCallback } from 'react';
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
    User,
    Users,
    CheckSquare,
    History,
    Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { patientService, doctorService } from '../../services/api';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { useAuth } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/shared/TableSkeleton';

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const { profile, signOut } = useAuth();
    const today = new Date().toISOString().split('T')[0];
    const todayFormatted = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [searchValue, setSearchValue] = useState('');
    const [patient, setPatient] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const [activeTab, setActiveTab] = useState('visits');
    const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
    const [editingVisit, setEditingVisit] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [visitForm, setVisitForm] = useState({
        diagnosis: '',
        prescription: '',
        notes: '',
        nextVisit: '',
        reportFiles: []
    });

    const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });
    const [recentVisits, setRecentVisits] = useState([]);
    const [loadingDashboard, setLoadingDashboard] = useState(true);


    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoadingDashboard(true);
            const [statsData, visitsData] = await Promise.all([
                doctorService.getStats(profile.id),
                doctorService.getRecentVisits(profile.id)
            ]);
            setStats(statsData);
            setRecentVisits(visitsData);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoadingDashboard(false);
        }
    }, [profile?.id]);

    /**
     * Refreshes dashboard data selectively to improve responsiveness after mutations.
     */
    const refreshTabData = useCallback(async () => {
        if (!profile?.id) return;
        try {
            const [statsData, visitsData] = await Promise.all([
                doctorService.getStats(profile.id),
                doctorService.getRecentVisits(profile.id)
            ]);
            setStats(statsData);
            setRecentVisits(visitsData);
        } catch (err) {
            console.error('Failed to refresh data', err);
        }
    }, [profile?.id]);

    React.useEffect(() => {
        if (profile?.id) fetchDashboardData();
    }, [profile?.id, fetchDashboardData]);

    const handleSearch = async (forcedId = null) => {
        const term = (typeof forcedId === 'string' ? forcedId : searchValue).trim();
        if (!term) return;

        if (forcedId && typeof forcedId === 'string') {
            setSearchValue(forcedId);
        }

        setSearching(true);
        setSearchError(null);
        setPatient(null);

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Search timed out. Please try again.')), 10000)
        );

        try {
            const data = await Promise.race([
                patientService.getPatientDetails(term),
                timeoutPromise
            ]);
            if (data && data.profile) {
                setPatient({
                    ...data.profile,
                    visits: data.visits || [],
                    labReports: data.labReports || [],
                    vaccinations: data.vaccinations || []
                });
            } else {
                setPatient(data);
            }
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
            if (editingVisit) {
                // UPDATE current visit
                await doctorService.updateVisit(editingVisit.rawId, {
                    diagnosis: visitForm.diagnosis,
                    prescription: visitForm.prescription,
                    notes: visitForm.notes,
                    nextVisit: visitForm.nextVisit,
                    patientId: patient.uuid,
                    hospitalId: profile.hospital_id,
                    labReportFiles: visitForm.reportFiles
                });
            } else {
                // CREATE new visit
                await doctorService.addVisit({
                    patientId: patient.uuid,
                    diagnosis: visitForm.diagnosis,
                    prescription: visitForm.prescription,
                    notes: visitForm.notes,
                    nextVisit: visitForm.nextVisit,
                    doctorId: profile.id,
                    hospitalId: profile.hospital_id,
                    labReportFiles: visitForm.reportFiles,
                });
            }
            setIsVisitModalOpen(false);
            setEditingVisit(null);
            setVisitForm({ diagnosis: '', prescription: '', notes: '', nextVisit: '', reportFiles: [] });
            // Refresh patient data and dashboard stats
            const updated = await patientService.getPatientDetails(searchValue.trim());
            if (updated && updated.profile) {
                setPatient({
                    ...updated.profile,
                    visits: updated.visits || [],
                    labReports: updated.labReports || [],
                    vaccinations: updated.vaccinations || []
                });
            } else {
                setPatient(updated);
            }
            refreshTabData();
        } catch (err) {
            console.error('Operation failed', err);
            alert('Failed: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const initiateVisitEdit = (visit) => {
        setEditingVisit(visit);
        setVisitForm({
            diagnosis: visit.diagnosis,
            prescription: visit.prescription,
            notes: visit.notes,
            nextVisit: visit.nextVisitDate || '',
            reportFiles: []
        });
        setIsVisitModalOpen(true);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Sidebar */}
            <aside className={`w-80 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} h-full overflow-y-auto`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 text-lg leading-tight">Doctor Dashboard</h1>
                            <p className="text-xs text-gray-500">{profile?.full_name ?? 'Doctor'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
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
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Lock className="w-5 h-5 text-orange-600" />
                            <h4 className="font-bold text-orange-900 text-sm">Data Integrity</h4>
                        </div>
                        <ul className="space-y-1.5">
                            {['Records only editable on same day', 'Previous history is read-only', 'No patient deletion allowed', 'Audit trail maintained'].map((item, i) => (
                                <li key={i} className="text-xs text-orange-600 flex items-start gap-2">
                                    <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5" />
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
                        className="p-2 -ml-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-600 rounded">
                            <Stethoscope className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">Health Portal</span>
                    </div>
                    <div className="w-10"></div>
                </div>

                {/* Search Bar */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Patient Lookup</h2>
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                            <Shield className="w-3 h-3" />
                            Doctor
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Enter Patient Health ID (e.g. HLTH-2024-001234)…"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={searching}
                            className="sm:w-auto px-6 h-12 flex items-center justify-center gap-2 whitespace-nowrap"
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

                {/* Dashboard Home View (Stats & Recent Activity) */}
                {!patient && !searching && !searchError && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {loadingDashboard ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
                                        <div className="flex justify-between items-center h-16">
                                            <div className="w-24 bg-gray-100 h-8 rounded" />
                                            <div className="w-12 bg-gray-100 h-12 rounded-lg" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">Today's Visits</p>
                                            <h3 className="text-3xl font-bold text-gray-900">{stats.today}</h3>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <Activity className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">This Week</p>
                                            <h3 className="text-3xl font-bold text-gray-900">{stats.week}</h3>
                                        </div>
                                        <div className="p-3 bg-indigo-50 rounded-lg">
                                            <Calendar className="w-6 h-6 text-indigo-600" />
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">This Month</p>
                                            <h3 className="text-3xl font-bold text-gray-900">{stats.month}</h3>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-lg">
                                            <CheckSquare className="w-6 h-6 text-purple-600" />
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">Total Consultations</p>
                                            <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <Users className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Recent Activity Table */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-0 flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Recent Consultations</h3>
                                    <p className="text-sm text-gray-500">Your most recent patient interactions</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-medium text-gray-500 italic">History View</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {loadingDashboard ? (
                                    <div className="p-6">
                                        <TableSkeleton rows={8} cols={5} />
                                    </div>
                                ) : recentVisits.length === 0 ? (
                                    <div className="p-16 text-center text-gray-400">
                                        <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No recent consultations found</p>
                                        <p className="text-sm mt-1">Search for a patient to start your first visit record</p>
                                    </div>
                                ) : (
                                    <table className="w-full min-w-[700px]">
                                        <thead className="bg-gray-50 text-left sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Patient Name</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Health ID</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Diagnosis</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Visit Date</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {recentVisits.map((visit) => (
                                                <tr key={visit.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-gray-900 font-bold">{visit.patientName}</span>
                                                            <span className="text-[10px] text-gray-500 uppercase">{visit.patientGender} • {visit.patientAge} Yrs</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{visit.patientId}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[200px]">{visit.diagnosis}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{visit.date}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleSearch(visit.patientId)}
                                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all cursor-pointer"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </>
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
                                        <div className="flex flex-col gap-2 mt-2">
                                            <p className="text-sm text-gray-400">
                                                <span className="font-semibold text-gray-500 mr-2">Contact:</span>
                                                {patient.contact} • {patient.email || 'No Email'}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                <span className="font-semibold text-gray-500 mr-2">Address:</span>
                                                {patient.address || '—'}
                                            </p>
                                            <p className="text-sm text-red-400">
                                                <span className="font-semibold text-red-500 mr-2">Emergency Contact:</span>
                                                {patient.emergencyContact || '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 shrink-0">
                                    <Button
                                        onClick={() => setIsVisitModalOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 px-6 w-auto whitespace-nowrap shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add New Visit
                                    </Button>
                                    <button
                                        onClick={() => {
                                            setPatient(null);
                                            setSearchValue('');
                                        }}
                                        className="text-xs font-semibold text-gray-400 hover:text-red-500 flex items-center gap-2 transition-all px-4 py-2 border border-gray-200 hover:border-red-100 hover:bg-red-50 rounded-lg cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear Results
                                    </button>
                                </div>
                            </div>

                            {/* Alerts / Profile Summary */}
                            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
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
                        <div className="mb-6 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit min-w-max">
                                {[
                                    { id: 'visits', label: 'Visit History', icon: Activity },
                                    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
                                    { id: 'labs', label: 'Lab Reports', icon: FileText },
                                    { id: 'vaccinations', label: 'Vaccinations', icon: Syringe },
                                ].map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
                                                <div className="flex items-center gap-2">
                                                    {visit.date === todayFormatted && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); initiateVisitEdit(visit); }}
                                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100 cursor-pointer"
                                                        >
                                                            Edit Visit
                                                        </button>
                                                    )}
                                                    <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-1 rounded tracking-wider">
                                                        #{visit.id}
                                                    </span>
                                                </div>
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
                                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
                                                <Lock className="w-3 h-3" />
                                                {visit.date === todayFormatted ? 'Editable until end of day' : 'Locked — Record is now immutable'}
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
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
                                {patient.vaccinations?.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400">
                                        <Syringe className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p>No vaccination records found.</p>
                                    </div>
                                ) : (
                                    <table className="w-full min-w-[600px]">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer">Vaccine</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer">Administered</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer">Next Due</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {patient.vaccinations.map((v, i) => {
                                                const isOverdue = v.nextDue && new Date(v.nextDue) < new Date();
                                                const isUpcoming = v.nextDue && new Date(v.nextDue) >= new Date();
                                                return (
                                                    <tr key={i} className="hover:bg-gray-50/50">
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.name}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">{v.displayDate}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {v.displayNextDue}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-50 text-red-700' : isUpcoming ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                                                                {isOverdue ? (
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                ) : isUpcoming ? (
                                                                    <Calendar className="w-3 h-3" />
                                                                ) : (
                                                                    <CheckCircle className="w-3 h-3" />
                                                                )}
                                                                {isOverdue ? 'Overdue' : isUpcoming ? 'Not Completed' : 'Completed'}
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
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
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
                onClose={() => { setIsVisitModalOpen(false); setEditingVisit(null); setVisitForm({ diagnosis: '', prescription: '', notes: '', nextVisit: '', reportFiles: [] }); }}
                title={editingVisit ? "Edit Visit Record" : "Add New Visit Record"}
            >
                <form className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar" onSubmit={handleAddVisit}>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2 text-xs text-orange-700 mb-2">
                        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{editingVisit ? "Editing this visit will update the existing record." : "This record will be permanent and immutable after today."}</span>
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
                            min={today}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50"
                            value={visitForm.nextVisit}
                            onChange={(e) => setVisitForm({ ...visitForm, nextVisit: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 font-bold">
                            <FileText className="w-4 h-4 inline mr-1" />{editingVisit ? "Add More Lab Reports" : "Optional Lab Reports"}
                        </label>
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files);
                                        setVisitForm(prev => ({ ...prev, reportFiles: [...prev.reportFiles, ...newFiles] }));
                                        e.target.value = ''; // Reset input to allow re-selecting same name
                                    }}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group"
                                >
                                    <div className="text-center">
                                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mx-auto mb-1" />
                                        <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">
                                            {visitForm.reportFiles.length > 0 ? 'Add more files...' : 'Select multiple files...'}
                                        </span>
                                    </div>
                                </label>
                            </div>

                            {visitForm.reportFiles.length > 0 && (
                                <div className="bg-blue-50 rounded-lg p-3 space-y-2 border border-blue-100 max-h-40 overflow-y-auto">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{visitForm.reportFiles.length} files staged for upload:</p>
                                    <ul className="space-y-1">
                                        {visitForm.reportFiles.map((f, i) => (
                                            <li key={i} className="flex items-center justify-between text-xs text-blue-700 bg-white/50 rounded-md px-2 py-1">
                                                <span className="truncate max-w-[180px] font-medium">{f.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] opacity-60">{(f.size / 1024).toFixed(1)} KB</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setVisitForm(prev => ({ ...prev, reportFiles: prev.reportFiles.filter((_, idx) => idx !== i) }));
                                                        }}
                                                        className="p-1 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-11 shrink-0 mt-2"
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
