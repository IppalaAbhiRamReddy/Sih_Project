# Deployment Guide

This guide provides step-by-step instructions for deploying the **Digital Health Care Record System** with the Frontend on **AWS** and the Backend on **Render**.

---

## 1. Frontend Deployment (AWS Amplify)

AWS Amplify is the easiest way to deploy a modern Vite + React application on AWS with built-in CI/CD.

### Steps:

1.  **Sign in to AWS Console**: Go to [AWS Amplify](https://console.aws.amazon.com/amplify/home).
2.  **Create New App**: Click **"New App"** -> **"Host web app"**.
3.  **Connect Git**: Select **GitHub** and authorize AWS to access your repository.
4.  **Select Repository**: Pick your `Sih_Project` repository and the `main` branch.
5.  **Configure Build Settings**:
    - **App Name**: `digital-healthcare-frontend`
    - **Framework**: It should detect "Web".
    - **Root Directory**: Set this to `frontend`.
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
6.  **Advanced Settings (Environment Variables)**:
    - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
    - Add `VITE_API_URL` (this will be your Render backend URL, e.g., `https://sih-backend.onrender.com/api`).
7.  **Save and Deploy**: Click **"Save and Deploy"**. AWS will now build and host your site.

---

## 2. Backend Deployment (Render)

Render provides an easy-to-use platform for hosting Django applications with automated deployments from Git.

### Prerequisites:

Ensure your `backend/requirements.txt` includes `gunicorn` and `psycopg2-binary`. (Already included in this project).

### Steps:

1.  **Create Account**: Log in to [Render.com](https://render.com).
2.  **New Web Service**: Click **"New +"** -> **"Web Service"**.
3.  **Connect Repository**: Link your GitHub repository.
4.  **Configure Service**:
    - **Name**: `sih-backend`
    - **Root Directory**: `backend`
    - **Runtime**: `Python 3`
    * **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
    - **Start Command**: `gunicorn sih_backend.wsgi:application`
5.  **Environment Variables**:
    - Click **"Advanced"** -> **"Add Environment Variable"**.
    - `SECRET_KEY`: (Generate a secure random string)
    - `DEBUG`: `False`
    - `DATABASE_URL`: (Your Supabase/PostgreSQL connection string)
    - `ALLOWED_HOSTS`: `sih-backend.onrender.com` (use your actual Render domain)
6.  **Deploy**: Click **"Create Web Service"**.

---

## 3. Post-Deployment Configuration

### Update CORS in Backend

Once your frontend is live on AWS (e.g., `https://main.d123.amplifyapp.com`), ensure you add this domain to the `CORS_ALLOWED_ORIGINS` in your Django `settings.py` or as an environment variable if configured.

### Update API URL in Frontend

Ensure your React app's `VITE_API_URL` points to the Render domain (e.g., `https://sih-backend.onrender.com/api`).

---

## 4. Database Setup (Supabase/PostgreSQL)

If you are using Supabase:

1. Create a new project in Supabase.
2. Get the Connection String from Project Settings -> Database.
3. Use this as the `DATABASE_URL` in your Render backend settings.
4. Run migrations via Render's build command or manually via terminal.
