import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';

import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientDashboard from './pages/patient/PatientDashboard';

// Placeholder for Dashboards (until we build them)
const DashboardPlaceholder = () => {
  const { role } = useParams(); // Capture dynamic role from URL (e.g. /admin)
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-4 capitalize">{role || 'User'} Dashboard</h1>
      <p className="text-gray-600 mb-8">This page is under construction. You have successfully logged in.</p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Go Home
      </button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Role Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/patient" element={<PatientDashboard />} />

        {/* Placeholder Routes for other Roles */}
        <Route path="/:role" element={<DashboardPlaceholder />} />
      </Routes>
    </Router>
  );
}

export default App;
