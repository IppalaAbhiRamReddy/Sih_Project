// services/api.js
// All data operations go through the Supabase JS client directly.
// Edge Function `create-user` handles privileged auth.admin.createUser calls.

import { supabase } from "../lib/supabase";

const DRF_BASE_URL = "http://localhost:8000/api";

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
  getPatientDetails: async (healthId) => {
    // 1. Find the patient profile by health_id
    const { data: patient, error: pErr } = await supabase
      .from("profiles")
      .select(
        "id, full_name, health_id, age, gender, blood_group, contact_number, email, address, emergency_contact, allergies, chronic_conditions, created_at",
      )
      .eq("health_id", healthId)
      .maybeSingle();

    if (pErr) throw pErr;
    if (!patient) throw new Error("Patient not found");

    const pid = patient.id;

    // 2. Fetch all related data in parallel
    const [visitsRes, labRes, vacRes] = await Promise.all([
      supabase
        .from("visits")
        .select(
          "id, visit_date, next_visit_date, diagnosis, prescription_text, clinical_notes, doctor:profiles!doctor_id(full_name, specialization, hospital:hospitals(name))",
        )
        .eq("patient_id", pid)
        .order("visit_date", { ascending: false }),

      supabase
        .from("lab_reports")
        .select(
          "id, report_name, file_url, report_date, status, hospital:hospitals!hospital_id(name)",
        )
        .eq("patient_id", pid)
        .order("report_date", { ascending: false }),

      supabase
        .from("vaccinations")
        .select("id, vaccine_name, administered_date, next_due_date")
        .eq("patient_id", pid)
        .order("administered_date", { ascending: false }),
    ]);

    if (visitsRes.error) throw visitsRes.error;
    if (labRes.error) throw labRes.error;
    if (vacRes.error) throw vacRes.error;

    // 3. Normalize into the shape the dashboards expect
    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    return {
      id: patient.health_id,
      uuid: patient.id,
      name: patient.full_name,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.blood_group,
      contact: patient.contact_number,
      email: patient.email,
      address: patient.address,
      emergencyContact: patient.emergency_contact,
      allergies: patient.allergies ?? [],
      chronicConditions: patient.chronic_conditions ?? [],
      memberSince: fmt(patient.created_at),

      visits: visitsRes.data.map((v) => ({
        id: v.id.slice(0, 8).toUpperCase(),
        date: fmt(v.visit_date),
        doctor: v.doctor?.full_name ?? "Unknown Doctor",
        hospital: v.doctor?.hospital?.name ?? "",
        specialty: v.doctor?.specialization ?? "",
        diagnosis: v.diagnosis,
        prescription: v.prescription_text ?? "",
        notes: v.clinical_notes ?? "",
      })),

      labReports: labRes.data.map((r) => ({
        name: r.report_name,
        date: fmt(r.report_date),
        hospital: r.hospital?.name ?? "",
        status: r.status,
        url: r.file_url,
      })),

      vaccinations: vacRes.data.map((v) => ({
        name: v.vaccine_name,
        date: v.administered_date || "", // Raw date for input fields
        nextDue: v.next_due_date || "", // Raw date for input fields
        displayDate: fmt(v.administered_date),
        displayNextDue: fmt(v.next_due_date),
      })),
    };
  },

  /**
   * Fetch patient details by UUID (used in PatientDashboard where we have profile.id).
   */
  getPatientDetailsByUUID: async (uuid) => {
    const { data: patient, error: pErr } = await supabase
      .from("profiles")
      .select("health_id")
      .eq("id", uuid)
      .single();

    if (pErr) throw pErr;
    return patientService.getPatientDetails(patient.health_id);
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
    // Delete existing rows for this patient first
    const { error: delErr } = await supabase
      .from("vaccinations")
      .delete()
      .eq("patient_id", patientUUID);
    if (delErr) throw delErr;

    if (!vaccinations || vaccinations.length === 0) return;

    const rows = vaccinations
      .filter((v) => v.name && v.name.trim())
      .map((v) => ({
        id: crypto.randomUUID(), // Manually generate UUID for primary key
        patient_id: patientUUID,
        vaccine_name: v.name.trim(),
        administered_date: v.date || null,
        next_due_date: v.nextDue || null,
        created_at: new Date().toISOString(), // Fix: provide timestamp for Supabase
      }));

    if (rows.length === 0) return;
    const { error } = await supabase.from("vaccinations").insert(rows);
    if (error) throw error;
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
  }) => {
    const { error } = await supabase.from("visits").insert({
      patient_id: patientId,
      doctor_id: doctorId,
      hospital_id: hospitalId,
      diagnosis,
      prescription_text: prescription,
      clinical_notes: notes,
      next_visit_date: nextVisit || null,
    });
    if (error) throw error;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STAFF SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const staffService = {
  /** Get patients registered at this hospital (all staff). */
  getRecentRegistrations: async (staffId, hospitalId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, health_id, age, gender, contact_number, created_at, registered_by_id, allergies, chronic_conditions, email, address, emergency_contact, blood_group",
      )
      .eq("role", "patient")
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

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
      by: p.registered_by_id === staffId ? "You" : "Other Staff",
      allergies: p.allergies ?? [],
      chronicConditions: p.chronic_conditions ?? [],
    }));
  },

  /** Count registrations for stats cards.
   *  today/week/month = hospital-wide; total = this staff member's own count. */
  getStats: async (staffId, hospitalId) => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    // Build each query independently — do NOT share a single query builder
    const [todayRes, weekRes, monthRes, totalRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "patient")
        .eq("hospital_id", hospitalId)
        .gte("created_at", `${todayStr}T00:00:00`),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "patient")
        .eq("hospital_id", hospitalId)
        .gte("created_at", weekAgo.toISOString()),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "patient")
        .eq("hospital_id", hospitalId)
        .gte("created_at", monthAgo.toISOString()),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "patient")
        .eq("registered_by_id", staffId),
    ]);

    return {
      today: todayRes.count ?? 0,
      week: weekRes.count ?? 0,
      month: monthRes.count ?? 0,
      total: totalRes.count ?? 0,
    };
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

  /** List doctors for this hospital. */
  getDoctors: async (hospitalId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, department_id, specialization, join_date, is_active, email",
      )
      .eq("role", "doctor")
      .eq("hospital_id", hospitalId)
      .order("join_date", { ascending: false });

    if (error) throw error;
    const fmt = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

    return data.map((d) => ({
      id: d.id,
      name: d.full_name ?? "—",
      dept: d.department_id ?? "—",
      spec: d.specialization ?? "—",
      join: fmt(d.join_date),
      active: d.is_active,
      email: d.email,
    }));
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
