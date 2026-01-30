import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, // For My Health Records icon
    Download,
    Shield,
    Lock,
    AlertTriangle,
    Eye, // For View Medical Records button
    FileText,
    Pill,
    Syringe, // For Vaccines
    Calendar,
    User,
    LogOut,
    CheckCircle,
    Loader
} from 'lucide-react';
import { patientService, authService } from '../../services/api';

export default function PatientDashboard() {
    const navigate = useNavigate();

    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const user = authService.getCurrentUser();
                // For dev/demo, if no user, assume a default ID
                const healthId = user ? (user.healthId || user.id) : 'HID123456';

                if (!healthId) {
                    console.warn("No health ID found, using fallback");
                }

                const data = await patientService.getPatientDetails(healthId || 'HID123456'); // Fallback ID for dev
                setPatientData(data);
            } catch (error) {
                console.error("Failed to fetch patient data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!patientData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Failed to load patient data.</p>
            </div>
        );
    }

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-600 rounded-lg">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="font-bold text-gray-900 text-lg">My Health Records</h1>
                    </div>
                </div>

                <nav className="p-6 space-y-6 flex-1">
                    <div className="space-y-3">
                        <span data-slot="badge" className="inline-flex items-center justify-center rounded-md border text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden [a&]:hover:bg-accent [a&]:hover:text-accent-foreground bg-green-50 text-green-700 border-green-200 px-3 py-1 mb-2">
                            <Eye className="w-3 h-3 mr-1" />
                            PATIENT ACCESS
                        </span>
                        <button
                            onClick={() => scrollToSection('medical-history')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                        >
                            <Eye className="w-5 h-5" />
                            View Medical Records
                        </button>
                    </div>

                    {/* Navigation Links (As requested "make it as sidebar") */}
                    <div className="space-y-1 pt-4">
                        <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Navigation</p>
                        <button onClick={() => scrollToSection('medical-history')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            Visit History
                        </button>
                        <button onClick={() => scrollToSection('prescriptions')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            Prescriptions
                        </button>
                        <button onClick={() => scrollToSection('lab-reports')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                            Lab Reports
                        </button>
                        <button onClick={() => scrollToSection('vaccinations')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                            Vaccines
                        </button>
                    </div>

                    {/* Info Boxes */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-sm">
                                <Lock className="w-4 h-4" />
                                Complete Transparency
                            </div>
                            <p className="text-xs text-blue-600 leading-relaxed">
                                Your complete medical history is available for viewing:
                            </p>
                            <ul className="mt-2 space-y-1">
                                {['All past records', 'Prescriptions & diagnoses', 'Lab reports & results', 'Vaccination history'].map((item, i) => (
                                    <li key={i} className="text-xs text-blue-600 flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3 text-blue-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <div className="flex items-center gap-2 mb-2 text-red-800 font-bold text-sm">
                                <Shield className="w-4 h-4" />
                                Read-Only Access
                            </div>
                            <p className="text-xs text-red-600 mb-1 font-medium">You cannot:</p>
                            <ul className="space-y-1">
                                {['Edit medical records', 'Delete visit history', 'Modify prescriptions', 'Access other patients\' data'].map((item, i) => (
                                    <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                                        <span className="text-red-400">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <div className="flex items-center gap-2 mb-1 text-green-800 font-bold text-sm">
                                Your Privacy
                            </div>
                            <p className="text-xs text-green-700">
                                Only you and authorized healthcare providers can view your medical records.
                            </p>
                        </div>
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
            <main className="flex-1 ml-80 p-8 space-y-8 scroll-smooth">
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{patientData.name}</h1>
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-bold">{patientData.id}</span>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium border border-gray-200 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Read-Only
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-600 mt-4">
                                <div><span className="text-gray-400">Age:</span> <span className="font-semibold text-gray-900">{patientData.age} years</span></div>
                                <div><span className="text-gray-400">Gender:</span> <span className="font-semibold text-gray-900">{patientData.gender}</span></div>
                                <div><span className="text-gray-400">Blood Group:</span> <span className="font-semibold text-gray-900">{patientData.bloodGroup}</span></div>
                                <div><span className="text-gray-400">Contact:</span> <span className="font-semibold text-gray-900">{patientData.contact}</span></div>
                                <div><span className="text-gray-400">Emergency Contact:</span> <span className="font-semibold text-gray-900">Jane Anderson +1 555-0102</span></div>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">Member Since: {patientData.memberSince}</div>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                <div className="space-y-4">
                    {patientData.allergies.length > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-red-900 text-sm flex items-center gap-2">
                                    Your Known Allergies
                                </h4>
                                <p className="text-sm text-red-700 font-medium mt-1">{patientData.allergies.join(', ')}</p>
                                <p className="text-xs text-red-500 mt-1">Always inform healthcare providers about these allergies</p>
                            </div>
                        </div>
                    )}
                    {patientData.chronicConditions.length > 0 && (
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                            <Activity className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-orange-900 text-sm">Chronic Conditions</h4>
                                <p className="text-sm text-orange-700 font-medium mt-1">{patientData.chronicConditions.join(', ')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Medical History (Visits) */}
                <section id="medical-history">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Your Complete Medical History</h2>
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full border border-gray-200">
                            {patientData.visits.length} Total Visits
                        </span>
                    </div>

                    <div className="space-y-6">
                        {patientData.visits.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No medical visits recorded yet</p>
                                <p className="text-sm text-gray-400 mt-1">Visit history will appear here after your appointments</p>
                            </div>
                        ) : (
                            patientData.visits.map((visit) => (
                                <div key={visit.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                                    {/* Header of Card */}
                                    <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-600">{visit.date}</span>
                                                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{visit.specialty}</span>
                                                    <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded border border-gray-200 uppercase tracking-wider flex items-center gap-1">
                                                        <Lock className="w-2.5 h-2.5" /> Read-Only
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-900 font-medium mt-1">{visit.doctor} • {visit.hospital}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-xs text-gray-400 mb-1">Visit #{visit.id}</span>
                                            <button className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Diagnosis</p>
                                            <p className="text-gray-900 font-bold text-lg">{visit.diagnosis}</p>
                                        </div>

                                        <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                            <p className="text-xs font-semibold text-blue-600 uppercase mb-1 flex items-center gap-1">
                                                <Pill className="w-3 h-3" /> Prescription
                                            </p>
                                            <p className="text-gray-800 font-medium text-sm whitespace-pre-line leading-relaxed">{visit.prescription}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Doctor's Notes</p>
                                            <p className="text-gray-600 text-sm leading-relaxed">{visit.notes}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Prescriptions Section (Added for Sidebar Link) */}
                <section id="prescriptions">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Medications & Prescriptions</h2>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-gray-100">
                            {patientData.prescriptions.length === 0 ? (
                                <div className="text-center py-8">
                                    <Pill className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 font-medium">No prescriptions found</p>
                                </div>
                            ) : (
                                patientData.prescriptions.map((script, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                                <Pill className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{script.name}</h4>
                                                <p className="text-sm text-gray-500">{script.dosage}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${script.status === 'Active'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                {script.status}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-1">{script.date}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>


                {/* Lab Reports */}
                <section id="lab-reports">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Laboratory Reports</h2>
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full border border-gray-200 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> View & Download Only
                        </span>
                    </div>

                    <div className="space-y-3">
                        {patientData.labReports.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-xl border border-gray-200 border-dashed">
                                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">No lab reports available</p>
                            </div>
                        ) : (
                            patientData.labReports.map((report, idx) => (
                                <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{report.name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{report.date} • {report.hospital}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${report.status === 'Normal'
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-orange-50 text-orange-700 border-orange-100'
                                            }`}>
                                            {report.status}
                                        </span>
                                        <button className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-blue-600 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                                            <Download className="w-3.5 h-3.5" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Vaccination History */}
                <section id="vaccinations">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Vaccination History</h2>
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full border border-gray-200 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Read-Only
                        </span>
                    </div>

                    <div className="bg-green-50/50 border border-green-100 rounded-xl overflow-hidden p-1">
                        <div className="space-y-1">
                            {patientData.vaccinations.length === 0 ? (
                                <div className="text-center py-8 bg-white/50 rounded-lg">
                                    <Syringe className="w-8 h-8 text-green-300 mx-auto mb-2" />
                                    <p className="text-gray-500 font-medium text-sm">No vaccination records found</p>
                                </div>
                            ) : (
                                patientData.vaccinations.map((vac, idx) => (
                                    <div key={idx} className="bg-white/80 p-4 rounded-lg flex items-center justify-between hover:bg-white transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                                <Syringe className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{vac.name}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">Administered: {vac.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Next Due</p>
                                            <p className="font-bold text-gray-900 text-sm">{vac.nextDue}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Footer Disclaimer */}
                <div className="text-center py-6 text-gray-400 text-xs">
                    <p>Health Records System (Major) • v1.0.0</p>
                    <p className="mt-1">Secure End-to-End Encrypted Records</p>
                </div>
            </main>
        </div>
    );
}
