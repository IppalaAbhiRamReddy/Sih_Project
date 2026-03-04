# Digital Health Care Record System: A Centralized SaaS Platform

**Authors:**

- I Abhiram Reddy (22BQ1A4261)
- P Arun (22BQ1A42B8)
- P Rakesh Deepak (22BQ1A42B7)
- P Veda (22BQ1A42B3)

**Guide:** Dr. M Srinivasa Rao

---

## 💡 Motivation

### Problem?

Personal health records are often fragmented across different clinics and hospitals, leading to inefficient diagnoses, redundant tests, and data loss. Patients struggle to maintain a unified medical history, and hospital authorities lack real-time insights into disease trends and department loads.

### Context

In the current healthcare landscape, the absence of a centralized digital footprint for patients across multiple institutions leads to administrative bottlenecks for hospital authorities and critical information gaps for doctors during emergencies.

### Measurable Objectives

- Develop a centralized "Patient Health Hub" (SaaS) to log comprehensive medical history, prescriptions, and lab reports.
- Implement a 5-tier Role-Based Access Control (Admin, Hospital Authority, Doctor, Staff, Patient) for secure data management.
- Automate healthcare analytics using AI to predict patient inflow and analyze disease distribution patterns.

### Why Existing Solutions are Insufficient?

Many existing Hospital Information Systems (HIS) are siloed within a single hospital. They lack a unified, cross-institutional tracking mechanism that allows patients and doctors to access a holistic health record securely via a cloud-based framework.

---

## 🛠️ Technology Stack

_Structured according to the premium categorization of Poster 2_

### Frontend

- **React.js / Vite**: For a high-performance, responsive user interface.
- **MUI / Tailwind CSS**: Modern styling for a premium dashboard experience.
- **Recharts**: For interactive AI analytics visualizations.
- **Axios**: Secure handling of RESTful API communications.

### Backend

- **Django Rest Framework (DRF)**: Scalable and robust API development.
- **SimpleJWT**: Secure, token-based authentication (Role-Based Access).
- **Python ML**: Dedicated analytics layer for model execution.

### AI / ML & Analytics

- **ARIMA (7, 1, 1)**: Optimized forecasting for 7-day weekly patient traffic.
- **Random Forest Ensemble**: 100-tree classification model for disease distribution.
- **Scikit-learn / Statsmodels**: Powering the predictive engine.
- **Pandas**: Efficient processing of large-scale medical data.

---

## 🏗️ Architecture

The system follows a centralized SaaS architecture:

- **Client Side (Browser)**: React.js Frontend interacting via REST (with JWT).
- **Application Layer**: Django DRF Backend serving as the primary API server.
- **Data Layer**: PostgreSQL Relational Database for structured health records.
- **AI Analytics Engine**: Python-based ML models serving predictions for hospital load and disease trends.

---

## ⚙️ Implementation Details

- **RBAC (Role-Based Access Control)**: Strict access levels across 5 roles (Admin, Authority, Doctor, Staff, Patient) ensuring data privacy.
- **Database Schema**: Centralized PostgreSQL schema featuring tables for Users, Patients, Medical Records (using JSONB for flexible diagnostic data), Visits, and Analytics.
- **Security & Integrity**: JWT-based authentication, audit logs, and encrypted communication to protect sensitive health information.

---

## 🧬 ML Pipeline & Evaluation

- **ARIMA Forecasting**: Optimized for daily hospital traffic prediction with high sensitivity to weekly seasonality.
- **Disease Distribution**: Categorical classification based on Month, Day of Week, and Patient demographics (Age/Gender).

### Evaluation Metrics (Verified)

- **ARIMA (Patient Inflow)**:
  - **MAE**: 5.76 (Highly realistic daily traffic prediction)
  - **RMSE**: 7.36
  - **MAPE**: 33.51% (Significantly improved from baseline)
- **Random Forest (Disease Patterns)**:
  - **Accuracy**: ~10% (Verified against synthetic random data; architecture ready for real-world patterns)
  - **F1 Score**: 0.09

---

## 🛑 Limitations & Future Scope

### Limitations

- Currently relies on synthetic data for ML training, which affects classification accuracy for disease distribution.
- Requires stable internet connectivity for real-time cloud-based record access.
- Data privacy compliance (HIPAA/GDPR) needs further legal auditing for production deployment.

### Future Scope

- **IoT Integration**: Connect medical devices (wearables) directly to the patient dashboard for real-time vitals tracking.
- **Deep Learning Upgrade**: Replace Random Forest with BERT-based NLP models for analyzing unstructured medical notes.
- **Telemedicine Suite**: Incorporate a video consultation module for remote doctor-patient interaction within the platform.
