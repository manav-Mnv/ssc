# Swift Student Challenge 2027 — Registration Portal

This repository contains the registration portal and admin utilities for the **Swift Coding Club** at **Parul University** (Apple Authorized Training Center). The platform assists in collecting applications, verifying requirements, and managing student registrations for the 2027 Swift Student Challenge.

## Technology Stack

- **Frontend:** Vanilla HTML, CSS, and JavaScript.
- **Animations:** GSAP (GreenSock Animation Platform) + ScrollTrigger, and Lenis (for smooth scrolling).
- **Database & API:** Supabase (PostgreSQL) with Row-Level Security (RLS) policies allowing public insertions but restricting read access.
- **Hosting:** Vercel.

## Directory Structure

```
├── .env.example              # Server-side environment variables template
├── .gitignore                # Root gitignore rules
├── vercel.json               # Vercel deployment configuration
├── index.html                # Landing page with inline guidelines & eligibility criteria
├── apply.html                # Public-facing multi-step registration form
├── app.js                    # Form validation, state preservation, & page routing logic
├── background.js             # Specular plasma/fluid WebGL background animation canvas
├── config.js.example         # Template for client-side Supabase configuration
├── api/
│   └── confirm.js            # Serverless function placeholder for email status notifications
├── docs/
│   ├── ARCHITECTURE.md       # Detailed technical design & system overview
│   └── data-model.md         # Database schema definition mapping columns to form fields
├── logs/
│   └── 2026-08-22.md         # Historical progress log
├── scripts/
│   ├── build-config.js       # Vercel build-hook script generating public client configs
│   └── send-confirmations.js # Nodemailer batch processor for sending queued confirmation emails
└── assets/                   # Images, vector graphics, and brand assets
```

## Getting Started

### Local Development

1. **Client Setup:** Copy `config.js.example` to `config.js` (which is gitignored) and replace the placeholders with your public Supabase credentials:
   ```javascript
   window.SUPABASE_URL = "https://your-project-ref.supabase.co";
   window.SUPABASE_ANON_KEY = "your-anon-key";
   ```

2. **Run Server:** Launch a local HTTP server inside the workspace root:
   ```bash
   python -m http.server 3000
   ```

3. **Browse:** Open `http://localhost:3000` in your web browser.

### Processing Emails

To prevent SMTP locking from university email domains, automated email confirmations are disabled on direct submission. Instead, emails are securely processed and dispatched in batch queues:

1. **Configure Environment:** Create a `.env` file from `.env.example` containing your Supabase service role key, database URL, admin credentials, and SMTP details.
2. **Execute Queue Script:**
   ```bash
   node scripts/send-confirmations.js
   ```
