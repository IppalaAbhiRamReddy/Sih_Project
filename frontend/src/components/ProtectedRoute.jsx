// src/components/ProtectedRoute.jsx
// Guards a route so only authenticated users with permitted roles can access it.
// Usage in App.jsx:
//   <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, profile, loading } = useAuth();

    // Show blank (or spinner) while session is being restored
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // Not logged in → go to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Logged in but no profile (e.g. trigger failed)
    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 max-w-md bg-white rounded-xl shadow border">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
                    <p className="text-gray-500 text-sm">
                        Your account exists but no profile was found. Please contact the system administrator.
                    </p>
                </div>
            </div>
        );
    }

    // Role check — if roles specified, must match
    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
        // Redirect to correct dashboard based on actual role
        const roleRoutes = {
            admin: '/admin',
            hospital_admin: '/hospital',
            doctor: '/doctor',
            staff: '/staff',
            patient: '/patient',
        };
        const redirect = roleRoutes[profile.role] || '/login';
        return <Navigate to={redirect} replace />;
    }

    // All checks passed — render the page
    return children;
}
