# SSC Registration System — Architecture & Data Pipeline

## Overview

The Swift Student Challenge (SSC) 2027 Registration platform utilizes a dual-pipeline, serverless architecture that guarantees data persistence, zero loss of applicant records, and automatic email dispatch with safety rate-limiting.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT CLIENT (BROWSER)                 │
│  - Vanilla HTML5 / CSS3 / JavaScript                        │
│  - Lenis Smooth Scroll + GSAP ScrollTrigger                 │
│  - WebGL Specular Background Canvas                         │
│  - LocalStorage Draft Recovery ('ssc2027_form_progress')    │
└──────────────┬──────────────────┬───────────────────┬───────┘
               │                  │                   │
      1. Insert (Anon Key)   2. Webhook (no-cors)   3. POST /api/confirm
               │                  │                   │
               ▼                  ▼                   ▼
┌────────────────────────┐ ┌───────────────┐ ┌───────────────────────────┐
│     SUPABASE (POSTGRES)│ │ GOOGLE SHEETS │ │  VERCEL SERVERLESS API    │
│                        │ │ (BACKUP SYNC) │ │  - /api/confirm.js        │
│ Table: registrations   │ │               │ │  - Nodemailer SMTP        │
│ - RLS: Insert Only     │ │ - Real-time   │ │  - 450 Daily Limit Guard  │
│ - Unique Constraints   │ │   Google Apps │ │  - Updates email_sent     │
│ - PgBouncer Pooling    │ │   Script      │ │    flag in Supabase       │
└────────────────────────┘ └───────────────┘ └─────────────┬─────────────┘
                                                           │
                                                           ▼
                                            ┌───────────────────────────┐
                                            │      STUDENT INBOX        │
                                            │ - Branded Confirmation    │
                                            │ - Unique Ref #ID Hash     │
                                            └───────────────────────────┘
```

---

## 🛡️ Key Architectural Decisions

### 1. Dual-Pipeline Redundancy
* **Primary Store:** Direct submission to Supabase PostgreSQL using client anon key with Row Level Security (`INSERT ONLY`).
* **Secondary Store:** Background asynchronous POST to Google Apps Script webhook appending rows directly into a master Google Sheet backup.

### 2. Email Delivery & Quota Shield
* Dispatched via Vercel Serverless Function ([api/confirm.js](file:///m:/sem3/scc/ssc/api/confirm.js)).
* **Daily Quota Safety (450 Limit):** Personal/Workspace Google SMTP has a 500 email/day hard cap. The system checks database records sent today (UTC), sending the first 450 instantly and gracefully leaving any overflow queued (`email_sent: false`) to protect credentials from SMTP suspension.

### 3. Client State & Form Recovery
* Form values and active step indices are automatically synced to browser `localStorage` on each field input.
* In the event of an accidental refresh or network drop, the form state is restored seamlessly upon return.

### 4. Row Level Security (RLS) Policy
* The public anon key is strictly prohibited from running `SELECT`, `UPDATE`, or `DELETE` operations on `public.registrations`.
* Student applicant privacy is protected at the database engine level.

---

## 🚀 Deployment & Environments

| Component | Target URL | Tech |
| :--- | :--- | :--- |
| **Landing & Form** | `https://swiftstudentchallenge.vercel.app` (or custom domain) | Static Vercel Edge |
| **Serverless Email API** | `https://.../api/confirm` | Node.js Serverless |
| **Database** | Supabase Cloud | PostgreSQL 15 |
| **Spreadsheet Sync** | Google Apps Script Webhook | Google Cloud |

