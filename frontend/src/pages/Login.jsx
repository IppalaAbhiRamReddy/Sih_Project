import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export default function Login() {
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Forgot password state
    const [forgotMode, setForgotMode] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetLoading(true);
        try {
            await authService.requestPasswordReset(resetEmail);
            setResetSent(true);
        } catch (err) {
            setResetError(err.message || 'Failed to send reset link.');
        } finally {
            setResetLoading(false);
        }
    };

    const roleRoutes = {
        admin: '/admin',
        hospital_admin: '/hospital',
        doctor: '/doctor',
        staff: '/staff',
        patient: '/patient',
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await signIn(email, password);
            const userProfile = data.user;
            const route = roleRoutes[userProfile?.role] || '/login';
            navigate(route, { replace: true });
        } catch (err) {
            setError(err.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 p-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Health Care Portal</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {forgotMode ? 'Reset your password' : 'Sign in with your credentials'}
                    </p>
                </div>

                {/* ── FORGOT PASSWORD MODE ── */}
                {forgotMode ? (
                    resetSent ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Check your inbox</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                A password reset link was sent to <strong>{resetEmail}</strong>.
                                Click the link in the email to set a new password.
                            </p>
                            <button
                                onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail(''); }}
                                className="text-sm text-blue-600 hover:underline font-medium"
                            >
                                ← Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <>
                            {resetError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 font-medium">
                                    {resetError}
                                </div>
                            )}
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={resetEmail}
                                        onChange={e => setResetEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm
                                         focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                                               text-white text-sm font-semibold rounded-xl transition-colors"
                                >
                                    {resetLoading ? 'Sending…' : 'Send Reset Link'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForgotMode(false)}
                                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                                >
                                    ← Back to Sign In
                                </button>
                            </form>
                        </>
                    )
                ) : (
                    /* ── NORMAL SIGN IN MODE ── */
                    <>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm
                                     focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => setForgotMode(true)}
                                        className="text-xs text-blue-600 hover:underline font-medium"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm
                                     focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                                           text-white text-sm font-semibold rounded-xl transition-colors mt-2"
                            >
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>

                        <p className="text-center text-xs text-gray-400 mt-6">
                            Access is assigned by your system administrator.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
