# Backend Data Breakdown

This document outlines the data requirements for each dashboard, categorizing data into what is displayed (fetched from backend), what is sent (user input), and what is system-generated.

## 1. Hospital Dashboard (Hospital Authority)

**Route:** `/hospital`

### A. Displayed Data (GET Requests)

Data the frontend needs to fetch to populate the dashboard.

#### 1. Statistics Cards

- **Total Departments**: `Integer` (Count of active departments)
- **Total Doctors**: `Integer` (Count of registered doctors)
- **Total Staff**: `Integer` (Count of registered staff)
- **Active Today**: `Integer` (Count of logins/activity for the day - _Likely derived from session logs_)

#### 2. Department Management Table

- **List of Departments**:
  - `id`: `String` (e.g., "DEPT001")
  - `name`: `String` (e.g., "Cardiology")
  - `head`: `String` (Name of HOD)
  - `doctors`: `Integer` (Count of doctors in this dept)
  - `staff`: `Integer` (Count of staff in this dept)
  - `active`: `Boolean` (Status)

#### 3. Doctor Management Table

- **List of Doctors**:
  - `id`: `String` (e.g., "DOC001")
  - `name`: `String`
  - `dept`: `String` (Department Name)
  - `spec`: `String` (Specialization)
  - `join`: `DateString` (YYYY-MM-DD)
  - `active`: `Boolean`

#### 4. Staff Management Table

- **List of Staff**:
  - `id`: `String` (e.g., "STAFF001")
  - `name`: `String`
  - `dept`: `String` (Department Name)
  - `role`: `String` (e.g., "Nurse", "Paramedic")
  - `join`: `DateString` (YYYY-MM-DD)
  - `active`: `Boolean`

#### 5. AI Analytics (Tab)

- **Load Forecast Data** (Time-series):
  - `date`: `DateString` (or relative "+7d")
  - `values`: `Map<Department, Integer>` (Predicted patient count per dept)
- **Disease Trends** (Distribution):
  - `disease_name`: `String`
  - `percentage`: `Float`
- **Department Load Status**:
  - `department_name`: `String`
  - `status`: `Enum` ("Normal", "Moderate", "High")
  - `capacity_percentage`: `Integer`

---

### B. Input Data (POST/PUT Requests)

Data collected from Forms/Actions to be sent to the backend.

#### 1. Add Department

- `id`: `String` (Manual Entry in UI currently)
- `name`: `String`
- `head`: `String` (Name of HOD)
- `doctors_initial_count`: `Integer` (Optional)
- `staff_initial_count`: `Integer` (Optional)

#### 2. Register Doctor

- `name`: `String`
- `email`: `String` (Used for auth setup)
- `department`: `String` (Selected from existing departments)

#### 3. Register Staff

- `name`: `String`
- `email`: `String`
- `department`: `String`

#### 4. Toggle Status (Action)

- `entity_id`: `String`
- `new_status`: `Boolean`

---

### C. Auto-Generated / Derived Data

Logic the backend must handle.

1.  **ID Generation**:
    - **Doctors/Staff**: UI does _not_ ask for ID. Backend must generate unique IDs (e.g., `DOC-[AUTO-INCREMENT]` or UUID).

2.  **Timestamps**:
    - `join_date`: Backend should set this to `current_date` upon creation.
    - `created_at`, `updated_at`: Standard audit fields.

3.  **Counts & Aggregations**:
    - **Department Counts**: The `doctors` and `staff` counts in the Department table should be dynamic _count queries_ on the Doctor/Staff tables, filtered by department. They should not be hardcoded fields in the Department table if possible.
    - **Active Today**: Need a mechanism to track daily user activity (sessions/login table).

4.  **AI Predictions**:
    - The `loadForecastData` requires an ML model or a heuristic algorithm processing historical `Visit` records.

5.  **Email Generation**:
    - Backend must auto-generate an email to the doctor/staff for setting their password and should same email can be used to reset password any no.of times.

## 2. Doctor Dashboard (Medical Staff)

**Route:** `/doctor`

### A. Displayed Data (GET Requests)

#### 1. Patient Search (Action initially, then Display)

- **Search Input**: `Health ID` (String)
- **Patient Profile (Result)**:
  - `id`: `String` (e.g., "HID123456")
  - `name`: `String`
  - `age`: `Integer`
  - `gender`: `String`
  - `bloodGroup`: `String`
  - `contact`: `String`
  - `allergies`: `List<String>`
  - `chronicConditions`: `List<String>`

#### 2. Visit History (Tab)

- **List of Visits**:
  - `id`: `Integer/String`
  - `date`: `DateString`
  - `specialty`: `String` (e.g., "Cardiology")
  - `type`: `Enum` ("READ-ONLY") (Frontend display logic)
  - `doctor`: `String` (Name of Doctor who created record)
  - `diagnosis`: `String`
  - `prescription`: `String`
  - `notes`: `String`

#### 3. Prescription History (Tab)

- **List of Prescriptions**:
  - `name`: `String` (Medicine Name & Dosage)
  - `date`: `DateString`
  - `doctor`: `String`

#### 4. Lab Reports (Tab)

- **List of Reports**:
  - `name`: `String` (Report Name)
  - `date`: `DateString`
  - `status`: `Enum` ("Normal", "Borderline High", "Critical")
  - `file_url`: `String` (Link to PDF/Image - implied)

---

### B. Input Data (POST/PUT Requests)

#### 1. Add New Visit (Append-Only)

- `patient_id`: `String` (Context from selected patient)
- `diagnosis`: `String`
- `prescription`: `String`
- `clinical_notes`: `String`

#### 2. Upload Lab Report (Action)

- `file`: `Binary/Blob`
- `status`: `Enum` ("Normal", "Borderline High", "Critical")
- `report_name`: `String` (Inferred from filename or manual entry - UI currently just clicks input)

---

### C. Auto-Generated / Derived Data

1.  **Immutable Records**:
    - Backend must enforce that once a visit record is created, it **cannot be edited or deleted**.

2.  **Doctor Context**:
    - `doctor_name` / `doctor_id` for the visit record should be taken from the **currently logged-in user's session**, not sent manually by the frontend.

3.  **Timestamps**:
    - `visit_date`: Should default to `current_date` if not specified (though history might allow backdating? UI shows "Date" in display, usually visit is "today").

4.  **Health ID Validation**:
    - Search requires exact match or robust search logic.

5.  **Add new visit-while adding new visit**:
    - `pateint id`: `String` (e.g., "HID123456") - should be derived based on the patient selected from the search results.

## 3. Patient Dashboard (My Health Records)

**Route:** `/patient`

### A. Displayed Data (GET Requests)

#### 1. Patient Profile

- **User Details** (Fetched from Auth/Profile endpoint):
  - `id`: `String` (e.g., "HID123456")
  - `name`: `String`
  - `age`: `Integer`
  - `gender`: `String`
  - `bloodGroup`: `String`
  - `contact`: `String`
  - `memberSince`: `DateString`
  - `emergencyContact`: `String` (Name & Phone)

#### 2. Health Alerts

- **Allergies**: `List<String>`
- **Chronic Conditions**: `List<String>`

#### 3. Medical History (Visits)

- **List of Visits**:
  - `id`: `Integer`
  - `date`: `DateString`
  - `specialty`: `String`
  - `doctor`: `String`
  - `hospital`: `String`
  - `diagnosis`: `String`
  - `prescription`: `String` (Text/Details)
  - `notes`: `String`

#### 4. Medications (Prescriptions - Auto-Generated)

- **List of Prescriptions** (Derived from visits ):
  - `name`: `String`
  - `dosage`: `String`
  - `date`: `DateString`
  - `status`: `Enum` ("Active", "Completed")

#### 5. Lab Reports

- **List of Reports**:
  - `name`: `String`
  - `date`: `DateString`
  - `hospital`: `String`
  - `status`: `Enum` ("Normal", "Borderline", "Critical")
  - `download_url`: `String`

#### 6. Vaccination History

- **List of Vaccines**:
  - `name`: `String`
  - `date`: `DateString` (Administered Date)
  - `nextDue`: `DateString`

---

### B. Input Data (Actions)

- **None** (Currently).
- The Patient Dashboard is designed as a **Read-Only** interface for the patient. They cannot add visits, edit records, or upload files in this version.

---

### C. Auto-Generated / Derived Data

1.  **Context Loading**:
    - The dashboard must automatically load data for the **currently designated "Health ID"** associated with the logged-in user account.
    - Unlike the Doctor view (which searches _any_ ID), the Patient view relies strictly on `AuthToken -> UseID -> HealthID`.

2.  **Status Calculations**:
    - **Medication Status**: "Active" vs "Completed" might need logic based on `prescription_date` + `duration` vs `current_date`.
    * **Vaccine Next Due**: explicitly set by the staff.

### Download

1.  **Visit**
2.  **labreport**

## 4. Staff Dashboard (Front Desk / Admin)

**Route:** `/staff`

### A. Displayed Data (GET Requests)

#### 1. Statistics Cards

- **Today's Registrations**: `Integer`
- **This Week**: `Integer`
- **This Month**: `Integer`
- **Your Registrations**: `Integer` (Count where `registered_by == current_user_id`)

#### 2. Recent Registrations Table

- **List of Patients** (Filtered by recent or search):
  - `id`: `String` (Health ID)
  - `name`: `String`
  - `age`: `Integer`
  - `gender`: `String`
  - `contact`: `String`
  - `date`: `DateString` (Registration Date)
  - `by`: `String` (Staff Name who registered)

#### 3. Search Results (For Edit)

- **Search Input**: `String` (Number/Name/ID)
- **Patient Result**:
  - Standard patient profile fields.
  - _Constraint_: Staff can only edit patients _they_ registered (frontend check `by === 'Staff (You)'`, backend must enforce this ownership).

---

### B. Input Data (POST/PUT Requests)

#### 1. Register New Patient

- `firstName`: `String`
- `lastName`: `String`
- `age`: `Integer`
- `gender`: `Enum` ("Male", "Female", "Other")
- `bloodGroup`: `Enum` ("A+", "O+", etc.)
- `contact`: `String` (Phone)
- `email`: `String`
- `address`: `String`
- `emergencyContact`: `String`
- `allergies`: `List<String>` (optional)
- `chronicConditions`: `List<String>` (optional)
- `vactions` : `form` (Name , date , nextdue) - can add multiple vaccines

#### 2. Edit Patient Details

- `id`: `String` (Target Patient ID)
- `name`: `String`
- `age`: `Integer`
- `gender`: `Enum`
- `bloodGroup`: `Enum`
- `contact`: `String`
- `email`: `String`
- `address`: `String`
- `emergencyContact`: `String`
- `allergies`: `List<String>` (optional)
- `chronicConditions`: `List<String>` (optional)
- `vactions` : `form` (Name , date , nextdue) - can add multiple vaccines

---

### C. Auto-Generated / Derived Data

1.  **Health ID Generation**:
    - Critical function. Backend must generate a **Lifetime Unique Health ID** (e.g., `HID` + Random 6 digits or UUID sequence) upon successful registration.

2.  **User Account Creation**:
    - Implicitly, registering a patient _creates a user account_ for them.
    - Backend must auto-generate an email to the patient for setting their password and should same email can be used to reset password any no.of times.

3.  **Audit Trail**:
    - `registered_by`: Must capture the **Staff ID** of the logged-in user creating the record.
    - `registration_date`: `current_timestamp`.

4.  **Access Rules**:
    - Staff are explicitly **blocked** from accessing medical data (Visits, Prescriptions). Backend must ensure the `/staff` endpoints or token scopes do not allow querying the `Visit` table.

## 5. Admin Dashboard (System Root)

**Route:** `/admin`

### A. Displayed Data (GET Requests)

#### 1. Statistics Cards

- **Hospital Authorities**: `Integer` (Total Count)
- **Total Active Systems**: `Integer`
- **Disabled Systems**: `Integer`
- **Total System Users**: `Integer` (Aggregate count of ALL users in the DB)

#### 2. Hospital Authority Management Table

- **List of Authorities**:
  - `id`: `String` (e.g., "HA001")
  - `name`: `String` (Hospital Name)
  - `date`: `DateString` (Registration Date)
  - `active`: `Boolean`
  - `email`: `String`
  - `phone`: `String`
  - `address`: `String`

---

### B. Input Data (POST/PUT Requests)

#### 1. Register Hospital Authority

- `name`: `String`
- `email`: `String`
- `phone`: `String`
- `address`: `String`

#### 2. Toggle Status (Action)

- `id`: `String` (Hospital Authority ID)
- `active`: `Boolean` (New Status)

---

### C. Auto-Generated / Derived Data

1.  **HA ID Generation**:
    - Backend must generate unique IDs for Hospital Authorities (e.g., `HA-[AUTO-INCREMENT]`).

2.  **Auth Credentials**:
    - System must auto-generate initial admin credentials for the _Hospital Authority_ upon creation and email them to the provided address to set password and should same email can be used to reset password any no.of times.

3.  **Global Aggregation**:
    - "Total System Users" requires a count query across multiple user tables (Doctors + Staff + Patients + Admins) or a centralized `Users` table.

4.  **Access Rules**:
    - **Strict Separation**: Admin is a functional superuser for _system management_ but should be **technologically prevented** from querying patient medical records.
