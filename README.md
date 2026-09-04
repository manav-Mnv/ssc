# Swift Student Challenge 2027 — Registration Platform

![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

The official registration portal for the **Swift Coding Club** at **Parul University** (Apple Authorized Training Center for Education). This platform facilitates student applications, requirement verification, and registration processing for the global Swift Student Challenge 2027.

---

## 🚀 Key Features

* **Interactive Multi-Step Application:** Dynamic 5-step form with live validation, progress tracking, and autosave.
* **Dual-Pipeline Ingestion:** Simultaneous real-time persistence to **Supabase PostgreSQL** and asynchronous backup to **Google Sheets**.
* **Instant Email Dispatch with Quota Shield:** Vercel Serverless Function (`/api/confirm`) dispatches branded confirmation emails via Nodemailer with a 450/day quota safety guard.
* **Draft Auto-Recovery:** Automatic client-side progress caching via `localStorage` so applicants never lose typed data.
* **Interactive Navigation Header:** Glassmorphic navigation pill with interactive external links to Parul University, Swift Coding Club, Apple Innovation Lab (AATCe), and Tinkering Hub.
* **Liquid Glass & 3D Parallax Visuals:** Built with vanilla WebGL shaders, GSAP animations, Lenis smooth scrolling, and specular glassmorphism.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | Vanilla HTML5, Vanilla CSS3 (Liquid Glass), Vanilla JS (ES6) |
| **Animations & FX** | GSAP 3, ScrollTrigger, Lenis Smooth Scroll, Custom WebGL Shader Background |
| **Database** | Supabase (PostgreSQL) with strict Row-Level Security (RLS) policies |
| **Serverless API** | Vercel Serverless Functions (`/api/confirm`), Node.js, Nodemailer |
| **Backup Sync** | Google Apps Script Webhook (Google Sheets) |
| **Deployment** | Vercel Edge Network |

---

## 📂 Directory Structure

```
├── .env.example              # Server-side environment variables template
├── .gitignore                # Git ignore rules for secrets and builds
├── vercel.json               # Vercel deployment & build configuration
├── index.html                # Landing page with guidelines, eligibility criteria & CTA
├── apply.html                # Multi-step interactive student application form
├── src/                      # Source Code (Modular Architecture)
│   ├── js/                   # Frontend Javascript Logic
│   │   ├── app.js            # Main Application Logic
│   │   ├── background.js     # WebGL specular fluid background shader animation
│   │   └── config.js         # Build-generated config file
│   └── css/                  # Styling
│       └── styles.css        # Design system & responsive styles
├── api/                      # Backend APIs
│   └── confirm.js            # Serverless function for sending confirmation emails safely
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # Technical design & architecture
│   └── data-model.md         # Supabase database schema
├── logs/                     # Maintenance logs
├── scripts/                  # Utilities
│   ├── build-config.js       # Vercel build hook generating config.js from env vars
│   └── send-confirmations.js # Batch processor for sending queued confirmation emails
└── assets/                   # SVG icons, university logos, and brand graphics
```

---

## ⚙️ Getting Started

### 1. Local Development Server

Run the built-in Express server:
```bash
npm install
node server.js
```
The application will be live at `http://localhost:3001`.

### 2. Environment Variables Setup

Create a `.env` file (copied from `.env.example`) with your Supabase and SMTP details:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM="Swift Coding Club Parul University" <your-email@gmail.com>
```

---

## 🔒 Security & Verification

* **Row Level Security (RLS):** Public anonymous key has `INSERT ONLY` access. Read, update, and delete actions are blocked.
* **Input Sanitization:** Student first names and inputs are sanitized to prevent email HTML injection.
* **Stress Tested:** 100% pass rate across 23 automated assertions covering concurrency bursts, edge-case rejection, and data normalization.
