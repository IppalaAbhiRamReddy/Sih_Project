// services/api.js
// Primary data operations go through Django REST Framework (DRF).
// Supabase is used exclusively for file storage (Storage buckets).

import { supabase } from "../lib/supabase";

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};
const DRF_BASE_URL = getBaseUrl();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Refreshes the access token using the refresh token.
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
    // If refresh fails, clear all tokens and force logout
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
 * Universal fetch wrapper that handles:
 * 1. Automatic Bearer token inclusion
 * 2. Automatic 401 intercept & token refresh
 * 3. One-time retry after refresh
 */
async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("access_token");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch(url, { ...options, headers });

  // If 401, try to refresh once
  if (res.status === 401) {
    try {
      token = await refreshAccessToken();
      // Retry with new token
      headers["Authorization"] = `Bearer ${token}`;
      res = await fetch(url, { ...options, headers });
    } catch (err) {
      // Refresh failed, error already handled in refreshAccessToken
      throw err;
    }
  }

  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const authService = {
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  },

  login: async (email, password) => {
    const res = await fetch(`${DRF_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Login failed");

    // Store tokens and user in localStorage
    localStorage.setItem("access_token", json.access);
    localStorage.setItem("refresh_token", json.refresh);
    localStorage.setItem("user", JSON.stringify(json.user));

    return json;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },

  requestPasswordReset: async (email) => {
    const res = await fetch(`${DRF_BASE_URL}/auth/password-reset/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to send reset link");
    return json;
  },

  resetPasswordConfirm: async (uidb64, token, newPassword) => {
    const res = await fetch(`${DRF_BASE_URL}/auth/password-reset-confirm/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uidb64, token, new_password: newPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to reset password");
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
        id: v.id.slice(0, 8).toUpperCase(),
        date: fmt(v.visit_date),
        doctor: v.doctor_name ?? "Unknown Doctor",
        hospital: v.hospital_name ?? "",
        specialty: v.specialization ?? "",
        diagnosis: v.diagnosis,
        prescription: v.prescription_text ?? "",
        notes: v.clinical_notes ?? "",
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

  /**
   * Fetch patient details by UUID (used in PatientDashboard where we have profile.id).
   */
  getPatientDetailsByUUID: async (
    uuid,
    include = "profile,visits,lab_reports,vaccinations",
  ) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/${uuid}/`,
    );
    if (!res.ok) throw new Error("Patient not found");
    const patient = await res.json();
    return patientService.getPatientDetails(patient.health_id, include);
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
    const { error } = await supabase
      .from("profiles")
      .update({
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
      })
      .eq("id", patientUUID);
    if (error) throw error;
  },

  /** Insert/replace all vaccination records for a patient. */
  updateVaccinations: async (patientUUID, vaccinations) => {
    // 1. Fetch current vaccinations to delete them (simulating the sync/replace behavior)
    // In a better API, we'd have a bulk update endpoint, but for now we follow the existing pattern
    const listRes = await fetchWithAuth(
      `${DRF_BASE_URL}/clinical/vaccinations/?patient=${patientUUID}`,
    );
    if (listRes.ok) {
      const existing = await listRes.json();
      for (const v of existing) {
        await fetchWithAuth(`${DRF_BASE_URL}/clinical/vaccinations/${v.id}/`, {
          method: "DELETE",
        });
      }
    }

    if (!vaccinations || vaccinations.length === 0) return;

    // 2. Insert new records
    for (const v of vaccinations) {
      if (!v.name || !v.name.trim()) continue;
      await fetchWithAuth(`${DRF_BASE_URL}/clinical/vaccinations/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patientUUID,
          vaccine_name: v.name.trim(),
          administered_date: v.date || null,
          next_due_date: v.nextDue || null,
        }),
      });
    }
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
    labReportFile,
  }) => {
    const now = new Date().toISOString();

    // 1. Handle Optional Lab Report Upload to Supabase Storage
    let labPublicUrl = null;
    if (labReportFile) {
      const fileExt = labReportFile.name.split(".").pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("lab-reports")
        .upload(fileName, labReportFile);

      if (uploadError) {
        if (uploadError.message?.includes("Bucket not found")) {
          throw new Error(
            "Storage Bucket 'lab-reports' not found. Please create it in your Supabase console with public access.",
          );
        }
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("lab-reports").getPublicUrl(fileName);
      labPublicUrl = publicUrl;
    }

    // 2. DRF: Create Lab Report record if file was uploaded
    if (labPublicUrl) {
      const labRes = await fetchWithAuth(
        `${DRF_BASE_URL}/clinical/lab-reports/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient: patientId,
            hospital: hospitalId,
            report_name: labReportFile.name,
            file_url: labPublicUrl,
            status: "Normal",
          }),
        },
      );
      if (!labRes.ok) throw new Error("Failed to save lab report record");
    }

    // 3. DRF: Insert Visit record
    const visitRes = await fetchWithAuth(`${DRF_BASE_URL}/clinical/visits/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient: patientId,
        doctor: doctorId,
        hospital: hospitalId,
        diagnosis,
        prescription_text: prescription,
        clinical_notes: notes,
        next_visit_date: nextVisit || null,
      }),
    });
    if (!visitRes.ok) throw new Error("Failed to save visit record");
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
    const data = await res.json();

    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    return data.map((v) => ({
      id: v.id.slice(0, 8).toUpperCase(),
      date: fmt(v.visit_date),
      patientName: v.patient_details?.full_name ?? "Unknown", // Need to ensure patient_details in serializer or just use profile
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
  getRecentRegistrations: async (staffId, hospitalId) => {
    // We filter by hospital in the DRF ProfilesViewSet
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/?role=patient`,
    );
    if (!res.ok) throw new Error("Failed to fetch registrations");
    const data = await res.json();

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

  /** Count registrations for stats cards.
   *  today/week/month = hospital-wide; total = this staff member's own count. */
  /** Count registrations for stats. */
  getStats: async (_staffId, _hospitalId) => {
    // We already have a dashboard_stats endpoint in HospitalViewSet
    // but the Staff Dashboard might need more specific counts if we want staff-specific total
    // Using systems_stats for now or updating it later
    const res = await fetchWithAuth(`${DRF_BASE_URL}/hospitals/system_stats/`);
    if (!res.ok) throw new Error("Failed to fetch staff stats");
    const json = await res.json();
    return json; // Note: may need field mapping if the staff dashboard expects today/week/month
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HOSPITAL SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const hospitalService = {
  /** Department list for this hospital — uses Django DRF. */
  getDepartments: async (_hospitalId) => {
    const res = await fetchWithAuth(`${DRF_BASE_URL}/hospitals/departments/`);
    if (!res.ok) throw new Error("Failed to fetch departments");
    const data = await res.json();

    return data.map((d) => ({
      id: d.id,
      name: d.name,
      head: d.head_name ?? "—",
      doctors: d.doctor_count,
      staff: d.staff_count,
      status: d.status,
    }));
  },

  /** Add a new department — uses Django DRF. */
  addDepartment: async (deptData, _hospitalId) => {
    const res = await fetchWithAuth(`${DRF_BASE_URL}/hospitals/departments/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: deptData.id,
        name: deptData.name,
        head_name: deptData.head || null,
        doctor_count: parseInt(deptData.doctors, 10) || 0,
        staff_count: parseInt(deptData.staff, 10) || 0,
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
  getDoctors: async (_hospitalId) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/?role=doctor`,
    );
    if (!res.ok) throw new Error("Failed to fetch doctors");
    const data = await res.json();

    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    return data
      .filter((d) => d.role === "doctor")
      .map((d) => ({
        id: d.id,
        name: d.full_name ?? "—",
        dept: d.department ?? "—",
        spec: d.specialization ?? "—",
        join: fmt(d.join_date),
        active: d.is_active,
        email: d.email,
      }));
  },

  /** Register a new doctor (calls Django DRF). */
  registerDoctor: async (doctorData, _hospitalId) => {
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
  registerStaff: async (staffData, _hospitalId) => {
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
  getStaff: async (_hospitalId) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/profiles/?role=staff`,
    );
    if (!res.ok) throw new Error("Failed to fetch staff");
    const data = await res.json();

    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    return data
      .filter((s) => s.role === "staff")
      .map((s) => ({
        id: s.id,
        name: s.full_name ?? "—",
        dept: s.department ?? "—",
        join: fmt(s.join_date),
        active: s.is_active,
        email: s.email,
      }));
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
  getStats: async (_hospitalId) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/hospitals/dashboard_stats/`,
    );
    if (!res.ok) throw new Error("Failed to fetch dashboard stats");
    return res.json();
  },

  /** AI Analytics: Department Load Forecast (ARIMA). */
  getAnalyticsForecast: async (timeRange) => {
    const res = await fetchWithAuth(
      `${DRF_BASE_URL}/analytics/trends/forecast/?range=${timeRange}`,
    );
    if (!res.ok) throw new Error("Failed to fetch forecast data");
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
    return res.json();
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
