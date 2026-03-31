/**
 * API Service Layer
 *
 * Centralized coordination for all network requests.
 * Logic is split into specialized modules: auth, patient, doctor, staff, hospital, and admin.
 * Primary data operations go through Django REST Framework (DRF).
 * Supabase is used exclusively for file storage (Storage buckets).
 */

import { supabase } from "../lib/supabase";

/**
 * Derives the base URL for the backend API.
 * Defaults to localhost if not provided in environment.
 */
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};
const DRF_BASE_URL = getBaseUrl();
const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Refreshes the JWT access token using the stored refresh token.
 * Triggers a logout if the refresh token is invalid or expired.
 */
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("No refresh token available");

  const res = await fetch(`${DRF_BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) {
    authService.logout();
    window.location.href = "/login?session=expired";
    throw new Error("Session expired. Please login again.");
  }

  const data = await res.json();
  localStorage.setItem("access_token", data.access);
  if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
  return data.access;
}

/**
 * Universal fetch wrapper with automatic Authorization headers and 401 retry logic.
 * @param {string} url - The target endpoint.
 * @param {object} options - Fetch options (method, headers, body).
 */
async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("access_token");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch(url, { ...options, headers });

  // Handle expired tokens by attempting a one-time refresh
  if (res.status === 401) {
    token = await refreshAccessToken();
    headers["Authorization"] = `Bearer ${token}`;
    res = await fetch(url, { ...options, headers });
  }

  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/** Service for handling user login, logout, and password resets. */
export const authService = {
  /** Retrieves the current user profile from local storage. */
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  },

  /** Authenticates user and persists credentials to local storage. */
  login: async (email, password) => {
    const res = await fetch(`${DRF_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const json = isJson ? await res.json() : {};
    if (!res.ok) throw new Error(json.error ?? `Login failed (${res.status})`);

    localStorage.setItem("access_token", json.access);
    localStorage.setItem("refresh_token", json.refresh);
    localStorage.setItem("user", JSON.stringify(json.user));

    return json;
  },

  /** Clears local session storage. */
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },

  /** Sends a password reset email. */
  requestPasswordReset: async (email) => {
    const res = await fetch(`${DRF_BASE_URL}/auth/password-reset/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const json = isJson ? await res.json() : {};
    if (!res.ok)
      throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  },

  /** Submits the new password using the reset token. */
  resetPasswordConfirm: async (uidb64, token, newPassword) => {
    const res = await fetch(`${DRF_BASE_URL}/auth/password-reset-confirm/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uidb64, token, new_password: newPassword }),
    });
    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const json = isJson ? await res.json() : {};
    if (!res.ok) throw new Error(json.error || `Reset failed (${res.status})`);
    return json;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const patientService = {
  /**
   * Fetch full patient details by health_id string.
   * Returns: profile + visits (joined with doctor name) + prescriptions + lab_reports + vaccinations
   */
  getPatientDetails: async (
    healthId,
    include = "profile,visits,lab_reports,vaccinations",
  ) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/medical_history/?health_id=${healthId}&include=${include}`,
    );
    if (!res.ok) {
      if (res.status === 404) throw new Error("Patient not found");
      throw new Error("Failed to fetch patient details");
    }
    const data = await res.json();
    return patientService._mapPatientResult(data);
  },

  /** INTERNAL: Map raw medical history response to frontend-friendly model. */
  _mapPatientResult: (data) => {
    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    const result = {};

    if (data.profile) {
      const p = data.profile;
      result.profile = {
        id: p.health_id,
        uuid: p.id,
        name: p.full_name,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.blood_group,
        contact: p.contact_number,
        email: p.email,
        address: p.address,
        emergencyContact: p.emergency_contact,
        allergies: p.allergies ?? [],
        chronicConditions: p.chronic_conditions ?? [],
        memberSince: fmt(p.created_at),
      };
    }

    if (data.visits) {
      result.visits = data.visits.map((v) => ({
        rawId: v.id,
        id: v.id.slice(0, 8).toUpperCase(),
        date: fmt(v.visit_date),
        doctor: v.doctor_name ?? "Unknown Doctor",
        hospital: v.hospital_name ?? "",
        specialty: v.specialization ?? "",
        diagnosis: v.diagnosis,
        prescription: v.prescription_text ?? "",
        notes: v.clinical_notes ?? "",
        nextVisitDate: v.next_visit_date || "",
      }));
    }

    if (data.lab_reports) {
      result.labReports = data.lab_reports.map((r) => ({
        name: r.report_name,
        date: fmt(r.report_date),
        hospital: r.hospital_name ?? "",
        status: r.status,
        url: r.file_url,
      }));
    }

    if (data.vaccinations) {
      result.vaccinations = data.vaccinations.map((v) => ({
        name: v.vaccine_name,
        date: v.administered_date || "",
        nextDue: v.next_due_date || "",
        displayDate: fmt(v.administered_date),
        displayNextDue: fmt(v.next_due_date),
      }));
    }

    return result;
  },

  /** Fetch patient details by UUID. */
  getPatientDetailsByUUID: async (
    uuid,
    include = "profile,visits,lab_reports,vaccinations",
  ) => {
    // Optimization: Directly fetch via medical_history using patient ID (UUID)
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/medical_history/?patient_id=${uuid}&include=${include}`,
    );
    if (!res.ok) throw new Error("Patient not found");
    const data = await res.json();
    return patientService._mapPatientResult(data);
  },

  /** Register a new patient (calls Django DRF). */
  registerPatient: async (formData, staffProfile) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/register-patient/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email || "",
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          hospital_id: staffProfile.hospital_id,
          age: parseInt(formData.age, 10),
          gender: formData.gender,
          blood_group: formData.bloodGroup,
          contact_number: formData.contact,
          address: formData.address,
          emergency_contact: formData.emergencyContact,
          allergies: formData.allergies
            ? formData.allergies
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          chronic_conditions: formData.chronicConditions
            ? formData.chronicConditions
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          vaccinations: (formData.vaccinations || []).filter((v) =>
            v.name.trim(),
          ),
        }),
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to register patient");
    return json;
  },

  /** Update a patient's contact details and optional medical fields. */
  updatePatient: async (patientUUID, updateData) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/${patientUUID}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: updateData.name,
          age: parseInt(updateData.age, 10),
          gender: updateData.gender,
          blood_group: updateData.bloodGroup,
          contact_number: updateData.contact,
          email: updateData.email,
          address: updateData.address,
          emergency_contact: updateData.emergencyContact,
          allergies: updateData.allergies ?? [],
          chronic_conditions: updateData.chronicConditions ?? [],
        }),
      },
    );
    if (!res.ok) throw new Error("Failed to update patient details");
  },

  /** Bulk update vaccination records (Highly Optimized). */
  updateVaccinations: async (patientUUID, vaccinations) => {
    if (!vaccinations) return;

    // Fix: Using the new bulk API to avoid network waterfall
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/clinical/vaccinations/bulk_update/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patientUUID,
          vaccinations: vaccinations
            .filter((v) => v.name && v.name.trim())
            .map((v) => ({
              vaccine_name: v.name.trim(),
              administered_date: v.date || null,
              next_due_date: v.nextDue || null,
            })),
        }),
      },
    );

    if (!res.ok) throw new Error("Failed to update vaccinations in bulk");
    return res.json();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const doctorService = {
  /** Append a new visit record. doctor_id and hospital_id come from the logged-in profile. */
  addVisit: async ({
    patientId,
    diagnosis,
    prescription,
    notes,
    nextVisit,
    doctorId,
    hospitalId,
    labReportFiles, // New: Array of files
  }) => {
    // 1. Upload and link if multiple files provided
    await doctorService._uploadAndLinkLabReports({
      patientId,
      hospitalId,
      files: labReportFiles,
    });

    // 2. DRF: Insert Visit record
    const visitRes = await fetchWithAuth(`${DRF_BASE_URL}/clinical/visits/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient: patientId,
        doctor: doctorId,
        hospital: hospitalId || null,
        diagnosis,
        prescription_text: prescription,
        clinical_notes: notes,
        next_visit_date: nextVisit || null,
      }),
    });
    if (!visitRes.ok) throw new Error("Failed to save visit record");
  },

  /** Update an existing visit record (only allowed for same-day visits). */
  updateVisit: async (
    visitId,
    {
      diagnosis,
      prescription,
      notes,
      nextVisit,
      patientId,
      hospitalId,
      labReportFiles,
    },
  ) => {
    // 1. Optional: Upload more reports even during edit
    if (labReportFiles && labReportFiles.length > 0) {
      await doctorService._uploadAndLinkLabReports({
        patientId,
        hospitalId,
        files: labReportFiles,
      });
    }

    // 2. Perform the update
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/clinical/visits/${visitId}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis,
          prescription_text: prescription,
          clinical_notes: notes,
          next_visit_date: nextVisit || null,
        }),
      },
    );
    if (!res.ok) {
      const json = await res.json();
      throw new Error(
        json.non_field_errors?.[0] ||
          json.error ||
          "Failed to update visit record",
      );
    }
  },

  /** INTERNAL: Shared logic for multi-file upload & DB linking. */
  _uploadAndLinkLabReports: async ({ patientId, hospitalId, files }) => {
    if (!files || files.length === 0) return;

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${patientId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("lab-reports")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("SUPABASE UPLOAD ERROR:", uploadError);
        throw new Error(
          `Upload failed for ${file.name}: ${uploadError.message}`,
        );
      }

      const { data: urlData } = supabase.storage
        .from("lab-reports")
        .getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // Create record in DB
      const labRes = await fetchWithAuth(
        `${DRF_BASE_URL}/clinical/lab-reports/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient: patientId,
            hospital: hospitalId || null,
            report_name: file.name,
            file_url: publicUrl,
            status: "Normal",
          }),
        },
      );
      if (!labRes.ok) throw new Error(`Failed to save record for ${file.name}`);
    }
  },

  /** Get stats for the logged-in doctor. */
  getStats: async (doctorId) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/clinical/visits/doctor_stats/?doctor_id=${doctorId}`,
    );
    if (!res.ok) throw new Error("Failed to fetch doctor stats");
    return res.json();
  },

  /** Get recent visits performed by this doctor. */
  getRecentVisits: async (doctorId) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/clinical/visits/recent_visits/?doctor_id=${doctorId}`,
    );
    if (!res.ok) throw new Error("Failed to fetch recent visits");
    const data = ensureArray(await res.json());

    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    return data.map((v) => ({
      rawId: v.id,
      id: v.id.slice(0, 8).toUpperCase(),
      date: fmt(v.visit_date),
      patientName: v.patient_details?.full_name ?? "Unknown",
      patientId: v.patient_details?.health_id ?? "—",
      patientGender: v.patient_details?.gender ?? "—",
      patientAge: v.patient_details?.age ?? "—",
      diagnosis: v.diagnosis,
    }));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STAFF SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const staffService = {
  /** Get patients registered at this hospital (all staff). */
  getRecentRegistrations: async (staffId) => {
    // We filter by hospital in the DRF ProfilesViewSet
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/?role=patient`,
    );
    if (!res.ok) throw new Error("Failed to fetch registrations");
    const data = ensureArray(await res.json());

    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    return data.map((p) => ({
      id: p.health_id,
      uuid: p.id,
      name: p.full_name,
      age: p.age,
      gender: p.gender ?? "—",
      contact: p.contact_number ?? "—",
      email: p.email,
      address: p.address,
      emergencyContact: p.emergency_contact,
      bloodGroup: p.blood_group,
      date: fmt(p.created_at),
      by: p.registered_by === staffId ? "You" : "Other Staff",
      allergies: p.allergies ?? [],
      chronicConditions: p.chronic_conditions ?? [],
    }));
  },

  /** Count registrations for stats. */
  getStats: async () => {
    const res = await fetchWithAuth(`${DRF_BASE_URL}/hospitals/staff_stats/`);
    if (!res.ok) throw new Error("Failed to fetch staff stats");
    return res.json();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HOSPITAL SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const hospitalService = {
  /**
   * INTERNAL: Map raw Profile objects from DRF to frontend-friendly model.
   * Handles consistency between bulk listing and individual fetches.
   */
  _mapProfileResult: (d) => {
    const fmt = (dateStr) =>
      dateStr
        ? new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    return {
      id: d.id,
      name: d.full_name ?? d.name ?? "—",
      dept: d.department_name ?? d.department ?? "—",
      dept_id: d.department_id || d.dept_id || "",
      spec: d.specialization ?? d.spec ?? "—",
      join: fmt(d.join_date ?? d.join),
      active: d.is_active ?? d.active,
      email: d.email,
      role: d.role,
    };
  },

  /** Department list for this hospital — uses Django DRF. */
  getDepartments: async () => {
    const res = await fetchWithAuth(`${DRF_BASE_URL}/hospitals/departments/`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    return ensureArray(await res.json());
  },

  /** Add a new department — uses Django DRF. */
  addDepartment: async (deptData) => {
    const res = await fetchWithAuth(`${DRF_BASE_URL}/hospitals/departments/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dept_code: deptData.dept_code,
        name: deptData.name,
        head: deptData.head || null,
        doctors: parseInt(deptData.doctors, 10) || 0,
        staff: parseInt(deptData.staff, 10) || 0,
      }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(
        json.error || json.detail || "Failed to add department via DRF",
      );
    }
    return res.json();
  },

  /** List doctors for this hospital (calls Django DRF). */
  getDoctors: async () => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/?role=doctor`,
    );
    if (!res.ok) throw new Error("Failed to fetch doctors");
    const data = ensureArray(await res.json());
    return data.map(hospitalService._mapProfileResult);
  },

  /** Register a new doctor (calls Django DRF). */
  registerDoctor: async (doctorData) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/register-user/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: doctorData.email,
          full_name: doctorData.name,
          role: "doctor",
          department_id: doctorData.dept || null,
          specialization: doctorData.specialization || null,
        }),
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to register doctor");
    return json;
  },

  /** Register a new staff member (calls Django DRF). */
  registerStaff: async (staffData) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/register-user/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: staffData.email,
          full_name: staffData.name,
          role: "staff",
          department_id: staffData.dept || null,
        }),
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to register staff");
    return json;
  },

  /** Update doctor's department and specialization (calls Django). */
  updateDoctor: async (doctorId, { department_id, specialization }) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/${doctorId}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: department_id || null, // Changed from department_id
          specialization: specialization || null,
        }),
      },
    );
    if (!res.ok) throw new Error("Failed to update doctor");
  },

  /** Update staff member's department (calls Django). */
  updateStaff: async (staffId, { department_id }) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/${staffId}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: department_id || null }), // Changed from department_id
      },
    );
    if (!res.ok) throw new Error("Failed to update staff");
  },

  /** List staff for this hospital (calls Django DRF). */
  getStaff: async () => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/?role=staff`,
    );
    if (!res.ok) throw new Error("Failed to fetch staff");
    const data = ensureArray(await res.json());
    return data.map(hospitalService._mapProfileResult);
  },

  /** Permanently remove a doctor/staff account (calls Django DRF). */
  deleteAccount: async (profileId) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/delete-user/${profileId}/`,
      {
        method: "DELETE",
      },
    );
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Failed to delete account");
    }
  },

  /** Enable/Disable login for an account (calls Django). */
  setAccountStatus: async (profileId, isActive) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/${profileId}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      },
    );
    if (!res.ok) throw new Error("Failed to update account status");
  },

  /** Stats card counts (calls Django). */
  getStats: async () => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/dashboard_stats/`,
    );
    if (!res.ok) throw new Error("Failed to fetch dashboard stats");
    return res.json();
  },

  /** Consolidated Overview (one trip) */
  getDashboardOverview: async () => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/dashboard_overview/`,
    );
    if (!res.ok) throw new Error("Failed to fetch dashboard overview");
    const json = await res.json();

    // Map profiles for consistency
    if (json.doctors)
      json.doctors = json.doctors.map(hospitalService._mapProfileResult);
    if (json.staff)
      json.staff = json.staff.map(hospitalService._mapProfileResult);

    return json;
  },

  /** AI Analytics: Department Load Forecast (ARIMA). */
  getAnalyticsForecast: async (timeRange) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/analytics/trends/forecast/?range=${timeRange}`,
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.details ||
          errorData.error ||
          `Failed to fetch forecast data (HTTP ${res.status})`,
      );
    }
    return res.json();
  },

  /** AI Analytics: Disease Trend Distribution (KNN). */
  getAnalyticsDiseaseDistribution: async (timeRange, dept) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/analytics/trends/disease_distribution/?range=${timeRange}&dept=${dept}`,
    );
    if (!res.ok) throw new Error("Failed to fetch disease distribution");
    return res.json();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SERVICE (unchanged shape, kept for AdminDashboard compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export const adminService = {
  getHospitals: async () => {
    const res = await fetchWithAuth(`${DRF_BASE_URL}/hospitals/`);
    if (!res.ok) throw new Error("Failed to fetch hospitals from DRF");
    return ensureArray(await res.json());
  },

  registerHospital: async (hospitalData) => {
    const res = await fetch(`${DRF_BASE_URL}/hospitals/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hospitalData),
    });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json.error ?? "Failed to register hospital via DRF");
    return json;
  },

  updateHospital: async (hospitalId, updateData) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/${hospitalId}/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      if (json.contact_email) throw new Error(json.contact_email);
      throw new Error(
        json.error ?? json.detail ?? "Failed to update hospital via DRF",
      );
    }
    return json;
  },

  getSystemStats: async () => {
    const res = await fetchWithAuth(`${DRF_BASE_URL}/hospitals/system_stats/`);
    if (!res.ok) throw new Error("Failed to fetch stats from DRF");
    return res.json();
  },

  deleteHospital: async (hospitalId) => {
    const res = await fetch(`${DRF_BASE_URL}/hospitals/${hospitalId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete hospital via DRF");
  },
};

export default supabase;
