import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Database,
    Shield,
    FileText,
    Activity,
    Users,
    Lock
} from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/login');
    };

    const FeatureCard = ({ icon: Icon, title, check, desc }) => (
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Header */}
            <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 tracking-tight">Digital Health Care Record System</span>
                    </div>
                    <button
                        onClick={handleLogin}
                        data-slot="button"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 py-2 has-[>svg]:px-3 bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                        Login
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-4xl font-semibold text-gray-900 mb-4">
                        Secure &amp; Centralized Patient Health Records
                    </h2>

                    <p className="text-lg text-gray-600 mb-8">
                        A comprehensive digital health care system that stores lifelong
                        electronic health records with role-based access control, ensuring data
                        security and seamless multi-hospital coordination.
                    </p>

                    <button
                        onClick={handleLogin}
                        data-slot="button"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 has-[>svg]:px-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                    >
                        Get Started
                    </button>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={Database}
                        title="Centralized Records"
                        desc="All patient health records in one secure location accessible across hospitals."
                    />
                    <FeatureCard
                        icon={Shield}
                        title="Role-Based Access"
                        desc="Strict access controls ensure data security and patient privacy."
                    />
                    <FeatureCard
                        icon={FileText}
                        title="Lifelong History"
                        desc="Complete medical history maintained throughout patient lifetime."
                    />
                    <FeatureCard
                        icon={Activity}
                        title="Real-Time Updates"
                        desc="Instant access to latest diagnoses, prescriptions, and lab reports."
                    />
                    <FeatureCard
                        icon={Users}
                        title="Multi-Hospital Access"
                        desc="Seamless data sharing between authorized healthcare providers."
                    />
                    <FeatureCard
                        icon={Lock}
                        title="Audit Logging"
                        desc="Complete transparency with detailed activity tracking and accountability."
                    />
                </div>

                {/* Key Benefits Section */}
                <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8 md:p-12 shadow-sm border border-blue-100">
                    <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Key Benefits</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        {[
                            { title: "Improved Continuity of Care", desc: "Access complete patient history for better treatment decisions" },
                            { title: "Reduced Duplicate Tests", desc: "Eliminate unnecessary procedures with accessible test results" },
                            { title: "Enhanced Data Security", desc: "Advanced encryption and role-based access controls" },
                            { title: "Public Health Insights", desc: "Aggregated anonymized data for health planning" },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-white font-semibold">✓</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-gray-50 py-8 mt-12">
                <div className="max-w-7xl mx-auto px-8 text-center text-gray-600">
                    <p>© 2024 Digital Health Care Record System. All rights reserved.</p>
                    <p className="mt-2 text-sm">Secure • Compliant • Patient-Centric</p>
                </div>
            </footer>
        </div>
    );
}
