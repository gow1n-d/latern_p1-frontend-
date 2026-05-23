# Decoupled Deployment Guide — Frontend & Backend Separation

This guide details how to separate and independently deploy the **React/Vite Frontend** and the **Supabase Backend** (Database Schema, Migrations, and Edge Functions).

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    User([User's Browser]) -->|Loads HTML/JS| Frontend[Vite Static Frontend]
    User -->|Supabase Queries| Database[Supabase PostgREST & Auth]
    User -->|REST Requests| Functions[Supabase Edge Functions]
    
    subgraph "Frontend Deployment (Vercel / Netlify)"
        Frontend
    end

    subgraph "Backend Deployment (Supabase Cloud)"
        Database
        Functions
    end
```

---

## 🎨 Part 1: Frontend Separation & Deployment

The frontend is a static React application built using Vite. It can be compiled into highly optimized HTML, CSS, and JS assets and hosted on any static provider like **Vercel**, **Netlify**, or **Cloudflare Pages**.

### 1. Build Commands & Output
- **Build Command**: `npm run build:frontend` (executes `vite build`)
- **Output Directory**: `dist` (this folder will contain all production-ready files)

### 2. Environment Variables Setup
When deploying to your hosting provider, you must configure the following **Environment Variables** in the provider's dashboard (e.g., under Settings -> Environment Variables):

| Key | Value / Source | Purpose |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://fudnetxikhjyekvvddix.supabase.co` | Supabase API connection endpoint |
| `VITE_SUPABASE_ANON_KEY` | *Your Publishable Anon Key* | Public access token for database and auth |
| `VITE_SUPABASE_PROJECT_ID` | `fudnetxikhjyekvvddix` | Supabase unique project reference |

### 3. Deploying to Vercel (Recommended)
1. Import your repository into the **Vercel Dashboard**.
2. Vercel will auto-detect **Vite** as your framework.
3. Keep default settings:
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist`
4. Add the three `VITE_` environment variables listed above.
5. Click **Deploy**. Your frontend is now online!

---

## ⚡ Part 2: Backend Separation & Deployment

The backend is composed of Supabase PostgreSQL schemas, migrations, and Deno-based Edge Functions. These are deployed directly to the **Supabase Cloud Platform** using the **Supabase CLI**.

### 1. Prerequisites
Install the Supabase CLI globally on your development machine:
```bash
npm install -g supabase
# Verify installation
supabase -v
```

### 2. Connect to Your Supabase Account
Log in to your Supabase CLI account and link the workspace to your active cloud project from the `backend` folder:
```bash
# Navigate to the backend folder containing the supabase setup
cd backend

# Log in to CLI
supabase login

# Link CLI to your remote project (uses Project ID: fudnetxikhjyekvvddix)
supabase link --project-ref fudnetxikhjyekvvddix
```
*Note: You will be prompted to enter your Database password which was set when creating the project.*

### 3. Deploying Database Migrations
To push all local database schema updates, tables, and RLS security policies to your live production database (run this from the root directory):
```bash
npm run deploy:db
```
*(Runs `cd backend && supabase db push` under the hood).*

### 4. Deploying Backend Edge Functions
To compile and deploy all AI edge functions (AI Assist, Check Plagiarism, Format Validation, etc.) to Supabase Cloud (run this from the root directory):
```bash
npm run deploy:backend
```
*(Runs `cd backend && supabase functions deploy` under the hood to deploy all functions).*

To deploy an individual function separately:
```bash
cd backend && supabase functions deploy generate-section --project-ref fudnetxikhjyekvvddix
```

### 5. Setting API Secrets (Gemini Keys) on Supabase
The AI edge functions require your Gemini API Key to generate content and diagrams. Set this secret on the Supabase Backend securely using the CLI:
```bash
cd backend && supabase secrets set GEMINI_API_KEY="AIzaSyA67JjBR9Hz0MvKJKT63XhlDD7XXbd6pvc" --project-ref fudnetxikhjyekvvddix
```
Once set, the live functions will immediately read the key from the Supabase Vault securely.

---

## 🔒 Part 3: Database Access Control & IP Whitelisting (Render Outbound IPs)

If you have enabled **Network Restrictions** (IP Whitelisting) on your Supabase Database to secure database access, you must authorize **Render's outbound IP ranges** to allow secure communication with your database. 

Navigate to your **Supabase Dashboard** -> **Project Settings** -> **Database** -> **Network Restrictions** and add the following CIDR IP blocks:

```text
74.220.48.0/24
74.220.56.0/24
```

Adding these guarantees that Render hosted services can query your PostgreSQL instance securely on ports `6543` (connection pooling) and `5432` (direct connection).

