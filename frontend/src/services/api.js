// services/api.js
// All data operations go through the Supabase JS client directly.
// Edge Function `create-user` handles privileged auth.admin.createUser calls.

import { supabase } from "../lib/supabase";

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
const DRF_BASE_URL = "http://localhost:8000/api";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the current auth session (JWT). */
async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/** Call the Edge Function that uses the service-role key to create a new auth user. */
async function createUserViaEdge(payload) {
  const session = await getSession();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch(EDGE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const json = await res.json();
    if (!res.ok)
      throw new Error(json.error ?? `Edge Function error (${res.status})`);
    return json;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        "Edge Function timed out after 30s. Check Supabase Edge Function logs at: https://supabase.com/dashboard/project/tksaiyrxdlefmjevurwy/functions/create-user/logs",
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
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
        "id, full_name, health_id, age, gender, blood_group, contact_number, address, emergency_contact, allergies, chronic_conditions, created_at",
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
          "id, visit_date, next_visit_date, diagnosis, prescription_text, clinical_notes, doctor:profiles!visits_doctor_id_fkey(full_name, specialization, hospital:hospitals(name))",
        )
        .eq("patient_id", pid)
        .order("visit_date", { ascending: false }),

      supabase
        .from("lab_reports")
        .select(
          "id, report_name, file_url, report_date, status, hospital:hospitals(name)",
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
        date: fmt(v.administered_date),
        nextDue: fmt(v.next_due_date),
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

  /** Register a new patient. Calls Edge Function to create auth user, then inserts profile. */
  registerPatient: async (formData, staffProfile) => {
    const email = formData.email || `${Date.now()}@patient.local`;
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    const result = await createUserViaEdge({
      email,
      full_name: fullName,
      role: "patient",
      hospital_id: staffProfile.hospital_id,
      age: parseInt(formData.age, 10),
      gender: formData.gender,
      blood_group: formData.bloodGroup,
      contact_number: formData.contact,
      address: formData.address,
      emergency_contact: formData.emergencyContact,
      registered_by: staffProfile.id,
    });

    // 2. The Edge Function might not handle medical arrays: follow-up update
    if (
      result.user_id &&
      (formData.allergies?.length > 0 || formData.chronicConditions?.length > 0)
    ) {
      await supabase
        .from("profiles")
        .update({
          allergies: formData.allergies ?? [],
          chronic_conditions: formData.chronicConditions ?? [],
        })
        .eq("id", result.user_id);
    }

    return result; // { user_id, health_id }
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
        patient_id: patientUUID,
        vaccine_name: v.name.trim(),
        administered_date: v.date || null,
        next_due_date: v.nextDue || null,
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
        "id, full_name, health_id, age, gender, contact_number, created_at, registered_by, allergies, chronic_conditions, email, address, emergency_contact, blood_group",
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
      by: p.registered_by === staffId ? "You" : "Other Staff",
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
        .eq("registered_by", staffId),
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
  /** Department list for this hospital — uses SECURITY DEFINER RPC to bypass RLS recursion. */
  getDepartments: async (_hospitalId) => {
    const { data, error } = await supabase.rpc("get_my_departments");
    if (error) throw error;

    const rows = data ?? [];
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      head: d.head_name ?? "—",
      doctors: d.doctor_count,
      staff: d.staff_count,
      status: d.status,
    }));
  },

  /** Add a new department — uses SECURITY DEFINER RPC to bypass RLS recursion. */
  addDepartment: async (deptData, _hospitalId) => {
    const { error } = await supabase.rpc("add_department", {
      p_name: deptData.name,
      p_head_name: deptData.head || null,
      p_doctor_count: parseInt(deptData.doctors, 10) || 0,
      p_staff_count: parseInt(deptData.staff, 10) || 0,
    });
    if (error) throw error;
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

  /** Register a new doctor (calls Edge Function). */
  registerDoctor: async (doctorData, hospitalId) => {
    return createUserViaEdge({
      email: doctorData.email,
      full_name: doctorData.name,
      role: "doctor",
      hospital_id: hospitalId,
      department_id: doctorData.dept || null,
      specialization: doctorData.specialization || null,
    });
  },

  /** Update doctor's department and specialization. */
  updateDoctor: async (doctorId, { department_id, specialization }) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        department_id: department_id || null,
        specialization: specialization || null,
      })
      .eq("id", doctorId);
    if (error) throw error;
  },

  /** Update staff member's department. */
  updateStaff: async (staffId, { department_id }) => {
    const { error } = await supabase
      .from("profiles")
      .update({ department_id: department_id || null })
      .eq("id", staffId);
    if (error) throw error;
  },

  /** List staff for this hospital. */
  getStaff: async (hospitalId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, department_id, specialization, join_date, is_active, email",
      )
      .eq("role", "staff")
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

    return data.map((s) => ({
      id: s.id,
      name: s.full_name ?? "—",
      dept: s.department_id ?? "—",
      join: fmt(s.join_date),
      active: s.is_active,
      email: s.email,
    }));
  },

  /** Register a new staff member (calls Edge Function). */
  registerStaff: async (staffData, hospitalId) => {
    return createUserViaEdge({
      email: staffData.email,
      full_name: staffData.name,
      role: "staff",
      hospital_id: hospitalId,
      department_id: staffData.dept || null,
    });
  },

  /** Permanently remove a doctor/staff account.
   *  Uses create-user Edge Function with action: 'delete'. */
  deleteAccount: async (profileId) => {
    const session = await getSession();
    const res = await fetch(EDGE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ action: "delete", userId: profileId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to delete account");
    return json;
  },

  /** Enable/Disable login for an account. */
  setAccountStatus: async (profileId, isActive) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", profileId);
    if (error) throw error;
  },

  /** Stats card counts. */
  getStats: async (hospitalId) => {
    const [docRes, staffRes, activeDocRes, activeStaffRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "doctor")
        .eq("hospital_id", hospitalId),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "staff")
        .eq("hospital_id", hospitalId),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "doctor")
        .eq("hospital_id", hospitalId)
        .eq("is_active", true),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "staff")
        .eq("hospital_id", hospitalId)
        .eq("is_active", true),
    ]);

    return {
      doctors: docRes.count ?? 0,
      staff: staffRes.count ?? 0,
      active: (activeDocRes.count ?? 0) + (activeStaffRes.count ?? 0),
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SERVICE (unchanged shape, kept for AdminDashboard compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export const adminService = {
  getHospitals: async () => {
    const res = await fetch(`${DRF_BASE_URL}/hospitals/`);
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
    const res = await fetch(`${DRF_BASE_URL}/hospitals/${hospitalId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
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
    const res = await fetch(`${DRF_BASE_URL}/hospitals/system_stats/`);
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
