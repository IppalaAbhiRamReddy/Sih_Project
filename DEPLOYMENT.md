# Deployment Guide

Since you have already pushed your code to Git, you can set up continuous deployment (CD) so that your live site updates automatically whenever you push changes.

## 1. Frontend Deployment (React + Vite)

The easiest way to deploy a Vite React app is using **Vercel** or **Netlify**. Both have free tiers.

### Option A: Using Vercel (Recommended)

1. Go to [Vercel.com](https://vercel.com) and Sign Up / Login with your GitHub/GitLab account.
2. Click **"Add New..."** -> **"Project"**.
3. Import your `sih_project` repository.
4. **Configure Project**:
   - **Framework Preset**: Vercel should automatically detect `Vite`.
   - **Root Directory**: Click "Edit" and select the `frontend` folder. **(Crucial Step)**.
   - **Build Command**: `npm run build` (Default).
   - **Output Directory**: `dist` (Default).
5. Click **Deploy**.
6. Once finished, you will get a URL (e.g., `https://sih-project-frontend.vercel.app`).

### Option B: Using Netlify

1. Go to [Netlify.com](https://netlify.com) and Login.
2. Click **"Add new site"** -> **"Import from an existing project"**.
3. Connect your Git provider and pick your repository.
4. **Site settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy site**.

---

## 2. Backend Deployment (Django)

> **Note**: It essentially appears your `backend` folder currently only contains `requirements.txt` and a virtual environment. You will need to initialize your fresh Django project (containing `manage.py`, `settings.py`, etc.) before you can successfully deploy the backend.

Once your Django code is ready, **Render** or **Railway** are great options.

### Prerequisites for Django Deployment

Before deploying, ensure you have:

1. **`gunicorn`** installed and in your `requirements.txt` (it serves the app in production).
2. A `Procfile` (optional but good for some platforms) or a specified "Start Command".
3. `ALLOWED_HOSTS` in `settings.py` set to `['*']` or your deployment domain.

### Deployment on Render (Free Tier available)

1. Go to [Render.com](https://render.com).
2. Click **"New"** -> **"Web Service"**.
3. Connect your Git repo.
4. **Settings**:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt && python manage.py migrate`
   - **Start Command**: `gunicorn <your_project_name>.wsgi:application`
5. Create the service.

## 3. Connecting Frontend to Backend

Once both are deployed:

1. In your **Frontend** (Vercel/Netlify), go to Settings -> Environment Variables.
2. Add `VITE_API_URL` (or whatever variable you use) with the value of your deployed Backend URL (e.g., `https://sih-backend.onrender.com`).
3. Redeploy the frontend for changes to take effect.
