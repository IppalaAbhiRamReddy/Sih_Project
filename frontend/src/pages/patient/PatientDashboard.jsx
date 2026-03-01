import React, { useState, useEffect } from 'react';
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
    LogOut,
    CheckCircle,
    Loader,
    Phone,
    MapPin,
    HeartPulse
} from 'lucide-react';
import { patientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PatientDashboard() {
    const navigate = useNavigate();
    const { profile, signOut } = useAuth();

    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('visits');

    useEffect(() => {
        if (profile?.id) fetchPatientData();
    }, [profile]);

    const fetchPatientData = async () => {
        try {
            console.log('[DEBUG] fetchPatientData: Starting fetch for UUID:', profile.id);
            setLoading(true);
            setError(null);
            console.time('fetchPatientDetails');
            const data = await patientService.getPatientDetailsByUUID(profile.id);
            console.timeEnd('fetchPatientDetails');
            console.log('[DEBUG] fetchPatientData: Success', data);
            setPatient(data);
        } catch (err) {
            console.error('[DEBUG] fetchPatientData: Failed', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading your health records…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white border border-red-200 rounded-xl p-8 max-w-md">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Could not load records</h3>
                    <p className="text-sm text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchPatientData}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium text-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 overflow-y-auto">
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
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-80 p-8">

                {/* Patient Header Banner */}
                {patient && (
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 mb-6 text-white shadow-sm">
                        <div className="flex justify-between items-start">
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
                                <span className="text-xs font-bold tracking-wider">PATIENT ACCESS</span>
                            </div>
                        </div>
                    </div>
                )}

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
                        </button>
                    ))}
                </div>

                {/* Visit History */}
                {activeTab === 'visits' && (
                    <div className="space-y-4">
                        {patient?.visits?.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 shadow-sm">
                                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No visits on record yet</p>
                            </div>
                        ) : (
                            patient?.visits?.map((visit, idx) => (
                                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                                                <Activity className="w-5 h-5 text-teal-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">Visit on {visit.date}</p>
                                                <p className="text-xs text-gray-500">Dr. {visit.doctor} • {visit.specialty}</p>
                                                {visit.hospital && <p className="text-xs text-gray-400">{visit.hospital}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-0.5 rounded tracking-wider">#{visit.id}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
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
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Doctor's Notes</p>
                                                <p className="text-sm text-gray-700 italic">{visit.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-400">View-only — records are immutable for your protection</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Prescriptions — sourced from visit records */}
                {activeTab === 'prescriptions' && (() => {
                    const visitPrescriptions = (patient?.visits ?? []).filter(v => v.prescription);
                    return (
                        <div className="space-y-4">
                            {visitPrescriptions.length === 0 ? (
                                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 shadow-sm">
                                    <Pill className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No prescriptions on record yet</p>
                                    <p className="text-sm mt-1">Prescriptions are added by your doctor during visits</p>
                                </div>
                            ) : (
                                visitPrescriptions.map((v, i) => (
                                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
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
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{v.hospital || ''}</span>
                                        </div>
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                                            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Prescription Notes</p>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{v.prescription}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    );
                })()}

                {/* Lab Reports */}
                {activeTab === 'labs' && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {patient?.labReports?.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p>No lab reports on record yet.</p>
                            </div>
                        ) : (
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
                                                <a
                                                    href={r.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-teal-600 hover:underline text-sm flex items-center gap-1"
                                                >
                                                    <Download className="w-3.5 h-3.5" />View Report
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Vaccinations */}
                {activeTab === 'vaccinations' && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {patient?.vaccinations?.length === 0 ? (
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
            </main>
        </div>
    );
}
