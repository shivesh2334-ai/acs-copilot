# ACS Copilot

A clinical decision-support tool for acute coronary syndromes (ACS). Clinicians enter
complaints, examination findings, ECG, troponin, echo, and risk-factor data; the app runs a
deterministic triage/risk engine and uses Claude to synthesize a clinician-facing note, plus a
follow-up query bot grounded in the specific case.

This app implements general, well-established principles of contemporary ACS care — ECG-based
STEMI/NSTE-ACS separation, troponin-based MI diagnosis, risk-based timing of invasive strategy,
guideline-directed medical therapy, secondary prevention and cardiac rehabilitation — written as
original logic. **It is not a reproduction of any single guideline document and does not replace
it.** Always cross-check outputs against the current full guideline text (e.g. the 2025
ACC/AHA/ACEP/NAEMSP/SCAI ACS guideline, Circulation 2025;151:e771–e862,
doi:10.1161/CIR.0000000000001309) and institutional protocols. This is decision support for a
qualified physician, not a diagnostic or prescribing authority.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Anthropic Claude API (`@anthropic-ai/sdk`) — narrative synthesis + query bot
- Supabase (optional) — case audit-trail persistence
- Vercel (`bom1` / Mumbai region by default)

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in ANTHROPIC_API_KEY (required); Supabase vars optional
npm run dev
```

Visit http://localhost:3000.

## Deploying to GitHub + Vercel

1. **Create the GitHub repo** (browser workflow):
   - Go to github.com → New repository → e.g. `acs-copilot` → Create.
   - In this project folder:
     ```bash
     git init
     git add .
     git commit -m "Initial commit: ACS Copilot"
     git branch -M main
     git remote add origin https://github.com/<your-username>/acs-copilot.git
     git push -u origin main
     ```
2. **Deploy on Vercel**:
   - vercel.com → Add New Project → Import the GitHub repo.
   - Framework preset: Next.js (auto-detected).
   - Add environment variables under Project Settings → Environment Variables:
     - `ANTHROPIC_API_KEY`
     - `ANTHROPIC_MODEL` (optional, defaults to `claude-sonnet-4-6`)
     - `NEXT_PUBLIC_SUPABASE_URL` (optional)
     - `SUPABASE_SERVICE_ROLE_KEY` (optional)
   - Region is pinned to `bom1` (Mumbai) via `vercel.json`; change if desired.
   - Deploy.

## Optional: Supabase case log

If you want an audit trail of cases run through the app:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your env.
4. The `service role` policy in the schema is permissive by default — tighten it if the app
   will ever be exposed without its own auth layer in front.

Without Supabase configured, the app still works fully; it just won't persist cases.

## How it works

- `lib/acsEngine.ts` — deterministic rules: classifies STEMI / NSTEMI / Unstable Angina /
  indeterminate / low-likelihood, assigns a risk tier, flags red flags, and generates
  investigation, treatment, short-term, long-term, and rehabilitation recommendations.
- `app/api/assess/route.ts` — runs the engine, then asks Claude to synthesize a concise
  clinician-facing note from the structured engine output (Claude is instructed not to
  contradict the engine's classification/risk).
- `app/api/ask/route.ts` — free-text follow-up Q&A grounded in the specific case's engine
  output and narrative.
- `components/PatientForm.tsx` — structured intake form.
- `components/ResultPanel.tsx` / `components/QueryBot.tsx` — results display and chat.

## Extending

- Add a proper GRACE score calculator (currently a simplified weighted risk tier) if you want
  numeric GRACE/TIMI scores rather than qualitative tiers.
- Add authentication (e.g. Supabase Auth or Clerk, matching your other EMC apps) before any
  real patient data is entered, and before loosening the Supabase RLS policy.
- Wire in your existing Google Calendar / Twilio SMS patterns for follow-up appointment
  scheduling directly from the "Follow-up" section.
