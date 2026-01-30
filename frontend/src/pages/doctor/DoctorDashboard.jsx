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
    Mic,
    FileText,
    Pill,
    Activity,
    Upload,
    LogOut,
    Eye,
    X,
    Calendar
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [patient, setPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('visits');
    const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);

    // Mock Patient Data
    const MOCK_PATIENT = {
        id: "HID123456",
        name: "John Anderson",
        age: 45,
        gender: "Male",
        bloodGroup: "O+",
        contact: "+1 555-0101",
        allergies: ["Penicillin", "Peanuts"],
        chronicConditions: ["Hypertension"],
        visits: [
            {
                id: 1, date: "2024-12-15", specialty: "Cardiology", type: "READ-ONLY",
                doctor: "Dr. Sarah Johnson", diagnosis: "Hypertension - Stage 1",
                prescription: "Amlodipine 5mg - Once daily",
                notes: "Patient shows elevated blood pressure. Lifestyle modifications recommended."
            },
            {
                id: 2, date: "2024-11-20", specialty: "General Medicine", type: "READ-ONLY",
                doctor: "Dr. Michael Chen", diagnosis: "Seasonal Flu",
                prescription: "Paracetamol 500mg - Thrice daily for 5 days",
                notes: "Patient presented with fever and body ache. Advised rest and hydration."
            }
        ],
        prescriptions: [
            { name: "Amlodipine 5mg - Once daily", date: "2024-12-15", doctor: "Dr. Sarah Johnson" },
            { name: "Paracetamol 500mg - Thrice daily for 5 days", date: "2024-11-20", doctor: "Dr. Michael Chen" }
        ],
        labReports: [
            { name: "Complete Blood Count", date: "2024-12-10", status: "Normal" },
            { name: "Lipid Profile", date: "2024-12-10", status: "Borderline High" }
        ]
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Simulate search logic - in real app, fetch from backend
        if (searchQuery.toUpperCase() === 'HID123456') {
            setPatient(MOCK_PATIENT);
        } else {
            alert('Patient not found. Try HID123456');
        }
    };

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 overflow-y-auto">
                <div className="p-6 border-b border-gray-100 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-tight text-lg">Doctor Dashboard</h1>
                            <p className="text-xs text-gray-500">Dr. Sarah Johnson - Cardiology</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-4">
                    <div className="space-y-3">
                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors shadow-sm"
                        >
                            <Search className="w-5 h-5" />
                            Search Patient
                        </button>
                        <button
                            onClick={() => setIsAddVisitOpen(true)}
                            className="w-full flex items-center gap-3 px-4 h-10 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <Plus className="w-5 h-5 text-gray-500" />
                            Add New Visit
                        </button>
                    </div>

                    {/* Info Boxes */}
                    <div className="mt-6 space-y-4">
                        {/* Append-Only Records */}
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Lock className="w-4 h-4 text-orange-600" />
                                <h4 className="font-bold text-orange-900 text-sm">Append-Only Records</h4>
                            </div>
                            <p className="text-xs text-orange-700 font-medium mb-2">Medical records are immutable:</p>
                            <ul className="space-y-1">
                                {['You can only ADD new visits', 'Past records are READ-ONLY', 'No editing or deleting allowed'].map((item, i) => (
                                    <li key={i} className="text-xs text-orange-600 flex items-start gap-2">
                                        <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Restricted Actions */}
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <h4 className="font-bold text-red-900 text-sm">Restricted Actions</h4>
                            </div>
                            <p className="text-xs text-red-700 font-medium mb-2">Doctors cannot:</p>
                            <ul className="space-y-1">
                                {['Edit past visit records', 'Delete medical history', 'Access system analytics', 'Manage user accounts'].map((item, i) => (
                                    <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                                        <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Scope */}
                        <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
                            <h4 className="font-bold text-cyan-900 text-sm mb-2">Your Scope</h4>
                            <p className="text-xs text-cyan-700 mb-2 block">Medical Data Creation</p>
                            <ul className="space-y-1">
                                {['Search patient records', 'View medical history', 'Add new visits (append-only)', 'Upload lab reports'].map((item, i) => (
                                    <li key={i} className="text-xs text-cyan-800 flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3 text-cyan-600" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
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
            <main className="flex-1 ml-80 p-8">
                {/* Search Header */}
                <div className="bg-white text-gray-900 flex flex-col gap-6 rounded-xl mb-8 border border-gray-200 shadow-sm">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="font-semibold text-gray-900">Patient Search</h2>
                            <span className="inline-flex items-center justify-center rounded-md border text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                                <Stethoscope className="w-3 h-3 mr-1" />
                                DOCTOR ACCESS
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="lucide lucide-search w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive pl-10 border-gray-300"
                                    placeholder="Enter Patient Health ID (e.g., HID123456)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 text-white h-9 px-4 py-2 bg-teal-500 hover:bg-teal-600 shadow-sm"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {!patient ? (
                    <div className="bg-white text-gray-900 flex flex-col gap-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-12 text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg mb-2 font-medium">No Patient Selected</p>
                            <p className="text-sm">
                                Search for a patient using their Health ID to view and update medical records
                            </p>
                            <p className="text-xs mt-4 text-gray-400">Try searching for: HID123456</p>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in space-y-6">
                        {/* Patient Header Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Health ID: {patient.id}</p>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{patient.name}</h2>
                                    <div className="flex gap-4 text-sm text-gray-600">
                                        <span>Age: <span className="font-medium text-gray-900">{patient.age}</span></span>
                                        <span>Gender: <span className="font-medium text-gray-900">{patient.gender}</span></span>
                                        <span>Blood Group: <span className="font-medium text-gray-900">{patient.bloodGroup}</span></span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Contact: {patient.contact}</p>
                                </div>
                                <button
                                    type="button"
                                    aria-haspopup="dialog"
                                    aria-expanded="false"
                                    data-state="closed"
                                    onClick={() => setIsAddVisitOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary-foreground h-9 px-4 py-2 has-[>svg]:px-3 bg-green-600 hover:bg-green-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add New Visit
                                </button>
                            </div>

                            {/* Alerts */}
                            <div className="space-y-3">
                                {patient.allergies.length > 0 && (
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-red-900 text-sm uppercase">Allergies Alert</h4>
                                            <p className="text-sm text-red-700">{patient.allergies.join(', ')}</p>
                                        </div>
                                    </div>
                                )}
                                {patient.chronicConditions.length > 0 && (
                                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex items-start gap-3">
                                        <Activity className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-orange-900 text-sm">Chronic Conditions</h4>
                                            <p className="text-sm text-orange-700">{patient.chronicConditions.join(', ')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="mb-6">
                            <div role="tablist" aria-orientation="horizontal" className="bg-gray-100 text-gray-500 h-10 w-fit items-center justify-center rounded-xl p-1 flex">
                                {['visits', 'prescriptions', 'lab_reports'].map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTab === tab}
                                        data-state={activeTab === tab ? "active" : "inactive"}
                                        onClick={() => setActiveTab(tab)}
                                        className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        {tab === 'visits' && 'Visit History'}
                                        {tab === 'prescriptions' && 'Prescriptions'}
                                        {tab === 'lab_reports' && 'Lab Reports'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[400px]">
                            {activeTab === 'visits' && (
                                <div className="space-y-4">
                                    {patient.visits.map(visit => (
                                        <div key={visit.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-3">
                                                    <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                        {visit.date}
                                                    </div>
                                                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                                        {visit.specialty}
                                                    </div>
                                                    <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <Lock className="w-3 h-3" />
                                                        READ ONLY
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">Visit #{visit.id}</span>
                                                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100 flex items-center gap-1">
                                                        <Shield className="w-3 h-3" />
                                                        No Edit
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-gray-900 mb-1">{visit.doctor}</h3>

                                            <div className="mt-4 space-y-3">
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Diagnosis</p>
                                                    <p className="text-gray-900 font-medium">{visit.diagnosis}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Prescription</p>
                                                    <p className="text-gray-900 font-medium">{visit.prescription}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Clinical Notes</p>
                                                    <p className="text-gray-600 text-sm">{visit.notes}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'prescriptions' && (
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900 text-lg">Prescription History</h3>
                                        <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            Read-Only
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {patient.prescriptions.map((script, idx) => (
                                            <div key={idx} className="p-6 flex items-start gap-4">
                                                <div className="p-2 bg-blue-50 rounded-lg">
                                                    <Pill className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                        {script.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mt-1">{script.date} - {script.doctor}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'lab_reports' && (
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900 text-lg">Laboratory Reports</h3>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                id="report-upload"
                                                className="hidden"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={(e) => alert(`File selected: ${e.target.files[0]?.name}`)}
                                            />
                                            <button
                                                onClick={() => document.getElementById('report-upload').click()}
                                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary-foreground h-9 px-4 py-2 has-[>svg]:px-3 bg-green-600 hover:bg-green-700"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload New Report
                                            </button>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {patient.labReports.map((report, idx) => (
                                            <div key={idx} className="p-6 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-blue-50 rounded-lg">
                                                        <FileText className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{report.name}</h4>
                                                        <p className="text-sm text-gray-500">{report.date}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${report.status === 'Normal'
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-orange-50 text-orange-700 border-orange-100'
                                                    }`}>
                                                    {report.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Add Visit Modal */}
            <Modal
                isOpen={isAddVisitOpen}
                onClose={() => setIsAddVisitOpen(false)}
                title="Add New Visit Record (Append-Only)"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Diagnosis</label>
                        <Input placeholder="Enter primary diagnosis" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Prescription</label>
                        <Input placeholder="Medicine Name, dosage, duration" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Clinical Notes</label>
                        <textarea
                            placeholder="Additional notes and observations"
                            className="w-full h-32 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none resize-none placeholder:text-gray-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Next Visit Date</label>
                        <div className="relative">
                            <Input placeholder="dd-mm-yyyy" type="date" className="w-full" />
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                        <Lock className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-yellow-800 text-sm">Immutable Record: <span className="font-normal text-yellow-700">Once saved, this record cannot be edited or deleted.</span></h4>
                        </div>
                    </div>

                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary-foreground h-9 px-4 py-2 has-[>svg]:px-3 w-full bg-teal-600 hover:bg-teal-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Save Visit (Append-Only)
                    </button>
                </div>
            </Modal>
        </div>
    );
}
