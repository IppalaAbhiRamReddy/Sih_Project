import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      // Store user details if needed, e.g. role
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem("user"));
  },
};

export const patientService = {
  getPatientDetails: async (healthId) => {
    const response = await api.get(`/patients/${healthId}`);
    return response.data;
  },
  searchPatients: async (query) => {
    const response = await api.get(`/patients/search`, { params: { query } });
    return response.data;
  },
  registerPatient: async (patientData) => {
    const response = await api.post("/patients/register", patientData);
    return response.data;
  },
  updatePatient: async (healthId, updateData) => {
    const response = await api.put(`/patients/${healthId}`, updateData);
    return response.data;
  },
  getMedicalHistory: async (healthId) => {
    const response = await api.get(`/patients/${healthId}/history`);
    return response.data;
  },
};

export const doctorService = {
  addVisit: async (visitData) => {
    const response = await api.post("/visits", visitData);
    return response.data;
  },
  getDoctorStats: async () => {
    const response = await api.get("/doctor/stats");
    return response.data;
  },
};

export const staffService = {
  getRecentRegistrations: async () => {
    const response = await api.get("/staff/registrations");
    return response.data;
  },
  getStats: async () => {
    const response = await api.get("/staff/stats");
    return response.data;
  },
};

export const adminService = {
  getHospitals: async () => {
    const response = await api.get("/admin/hospitals");
    return response.data;
  },
  registerHospital: async (hospitalData) => {
    const response = await api.post("/admin/hospitals", hospitalData);
    return response.data;
  },
  toggleHospitalStatus: async (hospitalId) => {
    const response = await api.patch(`/admin/hospitals/${hospitalId}/status`);
    return response.data;
  },
  getSystemStats: async () => {
    const response = await api.get("/admin/stats");
    return response.data;
  },
};

export const hospitalService = {
  getStats: async () => {
    const response = await api.get("/hospital/stats");
    return response.data;
  },
  getDepartments: async () => {
    const response = await api.get("/hospital/departments");
    return response.data;
  },
  addDepartment: async (deptData) => {
    const response = await api.post("/hospital/departments", deptData);
    return response.data;
  },
  getDoctors: async () => {
    const response = await api.get("/hospital/doctors");
    return response.data;
  },
  registerDoctor: async (doctorData) => {
    const response = await api.post("/hospital/doctors", doctorData);
    return response.data;
  },
  toggleDoctorStatus: async (doctorId) => {
    const response = await api.patch(`/hospital/doctors/${doctorId}/status`);
    return response.data;
  },
  getStaff: async () => {
    const response = await api.get("/hospital/staff");
    return response.data;
  },
  registerStaff: async (staffData) => {
    const response = await api.post("/hospital/staff", staffData);
    return response.data;
  },
  toggleStaffStatus: async (staffId) => {
    const response = await api.patch(`/hospital/staff/${staffId}/status`);
    return response.data;
  },
  getAnalyticsForecast: async (range) => {
    const response = await api.get("/hospital/analytics/forecast", {
      params: { range },
    });
    return response.data;
  },
  getAnalyticsDiseaseDistribution: async (range, dept) => {
    const response = await api.get("/hospital/analytics/diseases", {
      params: { range, dept },
    });
    return response.data;
  },
};

export default api;
