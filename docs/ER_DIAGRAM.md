# Project Entity-Relationship Diagram

This document contains the ER diagram for the **Digital Health Care Record System**, visualized using Mermaid.js.

## ER Diagram (Mermaid)

```mermaid
erDiagram
    %% Entities from users app
    USER {
        string id PK
        string full_name
        string email
        string role
        string contact_number
        boolean is_active
        date join_date
        string specialization
        string health_id
        int age
        string gender
        string blood_group
        text address
        json emergency_contact
        json allergies
        json chronic_conditions
    }

    %% Entities from hospitals app
    HOSPITAL {
        uuid id PK
        string name
        text address
        string contact_email
        string contact_phone
        boolean active
    }

    DEPARTMENT {
        string id PK
        string name
        string head_name
        int doctor_count
        int staff_count
        string status
    }

    %% Entities from clinical app
    VISIT {
        uuid id PK
        text diagnosis
        text prescription_text
        text clinical_notes
        datetime visit_date
        date next_visit_date
    }

    PRESCRIPTION {
        uuid id PK
        string medicine_name
        string dosage
        string duration
        string status
    }

    LAB_REPORT {
        uuid id PK
        string report_name
        string file_url
        date report_date
        string status
    }

    VACCINATION {
        uuid id PK
        string vaccine_name
        date administered_date
        date next_due_date
    }

    %% Relationships
    HOSPITAL ||--o{ DEPARTMENT : "has"
    HOSPITAL ||--o{ USER : "employs/manages"
    DEPARTMENT ||--o{ USER : "contains"

    USER ||--o{ USER : "registered_by"

    PATIENT ||--o{ VISIT : "undertakes"
    DOCTOR ||--o{ VISIT : "conducts"
    HOSPITAL ||--o{ VISIT : "hosts"

    VISIT ||--o{ PRESCRIPTION : "generates"
    PATIENT ||--o{ PRESCRIPTION : "receives"
    DOCTOR ||--o{ PRESCRIPTION : "prescribes"

    PATIENT ||--o{ LAB_REPORT : "belongs_to"
    HOSPITAL ||--o{ LAB_REPORT : "issues"

    PATIENT ||--o{ VACCINATION : "receives"

    %% Aliases for clarity (using USER entity)
    USER ||--o{ VISIT : "as_patient"
    USER ||--o{ VISIT : "as_doctor"
```

## Key Entities Description

- **USER (Profile)**: A unified model for all system users (Admins, Doctors, Patients, Staff). Roles define the available attributes (e.g., `specialization` for doctors, `health_id` for patients).
- **HOSPITAL**: Represents a healthcare facility registered in the system.
- **DEPARTMENT**: Functional units within a hospital (e.g., Cardiology, Radiology).
- **VISIT**: Records a clinical encounter between a doctor and a patient at a specific hospital.
- **PRESCRIPTION**: Medication details linked to a visit or issued directly to a patient.
- **LAB_REPORT**: Medical test results uploaded to a patient's record.
- **VACCINATION**: Immunization history for patients.

## Instructions to View

To render this diagram:

1. View it in a Markdown editor that supports Mermaid (like VS Code with Mermaid extension, GitHub, or GitLab).
2. Copy the Mermaid code block into the [Mermaid Live Editor](https://mermaid.live/).
