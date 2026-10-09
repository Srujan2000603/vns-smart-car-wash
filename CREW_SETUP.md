# VNS Live Crew Portal (Cloudflare D1)

The existing app at / is a **localStorage demo**. The new /crew interface uses **D1 shared records** and can be used across phones only AFTER binding a real D1 database, applying migrations, and initializing an admin. Do **NOT** give cleaners the demo root URL (/) expecting private access. The demo itself has no authenticated management access.

## Setup

1. In Cloudflare **Storage & databases → D1 SQLite Database**, create a database named `vns-crew` on the **free** plan.
2. In D1 dashboard open the database SQL console and apply `migrations/0001_crew.sql` (the statements can be pasted in the console). Alternatively use `npx wrangler d1 execute vns-crew --remote --file migrations/0001_crew.sql` from a terminal authenticated with Cloudflare. Prefer the UI if unfamiliar with command line.
3. Open **Workers & Pages → smart-car-wash → Settings → Bindings**. Add **D1 Database**, **variable name `DB`**, choose `vns-crew`. Save/redeploy. Exact menu labels can vary.
4. Under the Worker **Settings → Variables and Secrets**, add a **Secret** `BOOTSTRAP_SECRET` with at least 32 random characters. Never commit it or share it in chat. Save/redeploy.
5. To create the first manager account, make a one-time **POST /api/crew/bootstrap** request with same-origin fetch and the header `x-bootstrap-secret`. The payload is `{"companyId":"vns","name":"Manager","pin":"<unique 8-12 digit PIN>"}`. This endpoint works **only once** when user table is empty. A browser console can make this call while viewing your own `https://smart-car-wash.srujanmothe407.workers.dev/crew` URL:
   ```js
   // Paste in browser DevTools on your OWN site; only the first admin setup. Never share these values.
   const secret = prompt("Enter BOOTSTRAP_SECRET");
   const pin = prompt("Choose manager PIN (8-12 digits)");
   const result = await fetch("/api/crew/bootstrap", {
     method: "POST", headers: { "content-type": "application/json", "x-bootstrap-secret": secret },
     body: JSON.stringify({ companyId: "vns", name: "VNS Manager", pin })
   });
   console.log(result.status, await result.json());
   ```
6. Open `/crew` and log in as **ADMIN001** with the manager PIN. Under Manager setup, create individual `WRK001` through `WRK020` accounts with **different unpredictable 8–12 digit PINs**. Communicate PINs to workers privately, not in a public spreadsheet/chat.
7. Add job assignments in Manager setup. Worker phones open `https://smart-car-wash.srujanmothe407.workers.dev/crew`. They can access only their assigned jobs. They can update **today's jobs only**. Delayed/skipped requires reason. Monday jobs are rejected.
8. As manager, open /crew on your own device. The dashboard polls D1 every 15 seconds to show updated job status.

## Critical limitations before using real customer information

- This is a **separate live crew module**, not yet synchronized with existing 25-building local demo data or its automatic recurring schedules. Jobs must currently be created through the manager screen/API. Bulk import, recurring generation, and a centralized authenticated payments/admin dashboard are follow-up work.
- The app-wide demo dashboard at `/` is NOT access-controlled and contains local fictitious records. Keep all real customer data in server-protected workflows, not in the demo.
- Employee IDs + PINs are PBKDF2-hashed and verified server-side, PIN attempts temporarily lock accounts, sessions are hashed in the database and stored in Secure/HttpOnly/SameSite=Strict cookies lasting up to eight hours. Session management needs further real-world security review.
- Admin job edits and worker status changes are checked on the server for company and user scope. As built, workers cannot modify completed jobs after completion; admins can correct them.
- Changes appear to the manager on the next 15-second refresh, **not instantaneous WebSocket realtime**.
- **No automatic long-term backups** are installed. Export/back up D1 separately; free services can change or suspend.

## Verification checklist

- Run GitHub Actions test/build and check it passes after each commit.
- Confirm D1 binding and Secret configured. Without D1, `/api/crew/me` returns HTTP 503.
- Create admin and at least one cleaner; add two jobs.
- In a private/incognito browser on another device, log in as a cleaner. Only that worker's jobs must be returned by `GET /api/crew/jobs?date=YYYY-MM-DD`.
- Mark one job delayed with a reason; check manager sees it within 15 seconds.
- Attempt the other cleaner's job ID manually via `POST /api/crew/job-status`: must reject 403.
- Try skipping without a reason (400) and marking a Monday job (409/400).
- Confirm demo pages never show real D1 customer data.

**Never put BOOTSTRAP_SECRET, PINs, payment gateway secrets or actual customer records in GitHub.**
