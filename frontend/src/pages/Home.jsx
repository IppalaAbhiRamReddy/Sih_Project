import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Database,
    Shield,
    FileText,
    Activity,
    Users,
    Lock,
    CheckCircle
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        Login
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-24 pb-16 text-center px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        Secure & Centralized Patient Health Records
                    </h1>
                    <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                        A comprehensive digital health care system that stores lifelong electronic health records with
                        role-based access control, ensuring data security and seamless multi-hospital coordination.
                    </p>
                    <button
                        onClick={handleLogin}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        Get Started
                    </button>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                </div>
            </section>

            {/* Key Benefits Section */}
            <section className="py-24 bg-[#F0FDF4]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-12">Key Benefits</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 max-w-5xl mx-auto text-left">
                        {[
                            { title: "Improved Continuity of Care", desc: "Access complete patient history for better treatment decisions" },
                            { title: "Reduced Duplicate Tests", desc: "Eliminate unnecessary procedures with accessible test results" },
                            { title: "Enhanced Data Security", desc: "Advanced encryption and role-based access controls" },
                            { title: "Public Health Insights", desc: "Aggregated anonymized data for health planning" },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h3>
                                    <p className="text-gray-600">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        © 2026 Digital Health Care Record System. All rights reserved.
                    </p>
                    <div className="mt-4 flex justify-center gap-6 text-xs text-gray-400">
                        <span>Secure</span>
                        <span>•</span>
                        <span>Compliant</span>
                        <span>•</span>
                        <span>Patient-Centric</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
