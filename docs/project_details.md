# Digital Health Care Record System

**Type:** Web-Based Centralized Health Record Platform (SaaS)
**Stack:** React.js (Frontend) + Django DRF (Backend) + PostgreSQL (DB) + Python ML (Analytics)

## Overview

A role-based health record management system with 5 distinct roles:

1. **Admin**: User management, system config.
2. **Hospital Authority**: Dept/Doctor/Staff management, AI Analytics (Load Prediction, Disease Trends).
3. **Doctor**: Medical records, prescriptions, lab reports.
4. **Staff**: Patient registration and contact info management.
5. **Patient**: View own records, history, prescriptions.

## Key Features

- **RBAC**: Strict role-based access control.
- **AI Analytics**: Department load prediction & disease trend analysis (Hospital Authority only).
- **Security**: JWT Auth, audit logs, encrypted data.

## Database Schema Highlights

- **Users**: Centralized auth table.
- **Patients**: Demographics & contact info.
- **MedicalRecords**: Diagnosis, treatment, prescriptions (JSONB).
- **Visits**: Tracking patient visits and vitals.
- **AnalyticsData**: Storing ML predictions.

## Tech Stack Details

- **Frontend**: React, Vite, MUI/Tailwind, Recharts, Axios.
- **Backend**: Django, DRF, SimpleJWT, Celery (optional).
- **Database**: PostgreSQL.
- **ML**: Scikit-learn, Pandas, Statsmodels.
