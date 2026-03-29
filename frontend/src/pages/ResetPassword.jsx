import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const query = new URLSearchParams(window.location.search);
    const uidb64 = query.get('uidb64');
    const token = query.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await authService.resetPasswordConfirm(uidb64, token, password);
            setDone(true);
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
                    <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account</p>
                </div>

                {done ? (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Password Updated!</h2>
                        <p className="text-sm text-gray-500">Redirecting you to login…</p>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm
                                         focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.643-9.943-6.442a5.04 5.04 0 012.064-2.138m7.754 1.121a3 3 0 11-4.243 4.243m4.242-4.242L15 15m4.5-4.5a10.05 10.05 0 01-4.5 4.5m4.5-4.5C21.643 14.268 19 18.057 15.192 19.732a5.04 5.04 0 01-2.138-2.064M15 15L3 3" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        placeholder="Re-enter password"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm
                                         focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 pr-10"
                                    />
                                </div>
                            </div>

                            {/* Password strength hint */}
                            {password.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                    {[...Array(4)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${password.length >= (i + 1) * 3
                                                ? password.length >= 12
                                                    ? 'bg-green-500'
                                                    : password.length >= 8
                                                        ? 'bg-yellow-400'
                                                        : 'bg-red-400'
                                                : 'bg-gray-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                                           text-white text-sm font-semibold rounded-xl transition-colors mt-2 cursor-pointer"
                            >
                                {loading ? 'Updating…' : 'Set New Password'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
