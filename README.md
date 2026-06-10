# Job Agent

Automated job discovery and application preparation pipeline.

**Flow:** n8n discovers jobs daily → Vercel dashboard for review → GitHub Actions prepares application materials → you send manually.

## Quick Start

```bash
# 1. Create Supabase project and run migration
# 2. Deploy to Vercel
cd job-agent && npm install
vercel

# 3. Add GitHub repo secrets (OPENAI_API_KEY, VERCEL_APP_URL, VERCEL_CALLBACK_SECRET)
# 4. Import n8n workflow (no ingest credentials needed — see n8n/SETUP-INGEST.md)
# 5. Activate workflow → jobs appear in your inbox daily at 08:00
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      n8n        │────▶│  Vercel App     │────▶│ GitHub Actions  │
│ (job discovery) │     │ (inbox + API)   │     │ (prepare apps)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
   Remotive API            Supabase DB            cv repo commit
   WWR RSS                 Job scoring            AI-tailored CV
   Arbeitnow API           Approve/Reject         PDF generation
```

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:

```sql
-- Copy contents of supabase/migrations/001_jobs.sql
```

3. Copy your project URL and service role key from Settings → API

### 2. Deploy to Vercel

```bash
cd job-agent
npm install
```

1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Set root directory to `job-agent`
3. Add environment variables:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `GITHUB_TOKEN` | GitHub PAT with `repo` scope |
| `GITHUB_REPO` | Your cv repo, e.g. `dub1c/cv` |
| `N8N_WEBHOOK_SECRET` | Random secret for n8n auth |
| `VERCEL_CALLBACK_SECRET` | Random secret for Actions callback |
| `DASHBOARD_PASSWORD` | Password to access the inbox |

4. Deploy

### 3. GitHub Repository Secrets

Add these secrets to your cv repo (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for CV tailoring |
| `VERCEL_APP_URL` | Your deployed Vercel app URL |
| `VERCEL_CALLBACK_SECRET` | Same as Vercel env var |

### 4. n8n Workflow

1. Go to your n8n instance: https://dub1c.app.n8n.cloud
2. **Delete** any old "Job Agent" workflows (stale imports may reference missing credentials).
3. Import workflows — pick one:
   - **Test ingest:** `n8n/workflow-test-ingest.json` (manual trigger, Remotive → inbox)
   - **Daily cron:** `n8n/workflow-job-discovery.json` (08:00 Amsterdam)
   - **From GitHub:**  
     `https://raw.githubusercontent.com/Stdubic/supabase/main/n8n/workflow-test-ingest.json`
4. **Ingest to Vercel** is a **Code** node — it calls the API with `this.helpers.httpRequest` and needs **no n8n credentials**. The Bearer token is embedded in the node (must match `N8N_WEBHOOK_SECRET` in Vercel).
5. Optional: **SMTP** credential for the **Send Email** node in the daily workflow.
6. Optional n8n env vars: `NOTIFICATION_EMAIL` for email summaries.
7. Run **Manual Test** on the test workflow → expect `{ "success": true, "inserted": N }`.
8. Activate the daily workflow when ready.

See **`n8n/SETUP-INGEST.md`** if you see "Credentials not found".

**Screenshot for n8n EM application:** After importing, take a screenshot of the workflow canvas and add it to your n8n application materials.

## Usage

### Daily Flow

1. n8n runs at 08:00 Amsterdam time
2. Fetches jobs from Remotive, We Work Remotely, Arbeitnow
3. Filters for relevant roles (PHP, Laravel, Symfony, backend, etc.)
4. Sends new jobs to Vercel
5. Emails you a summary

### Reviewing Jobs

1. Go to `https://your-app.vercel.app/inbox`
2. Login with `DASHBOARD_PASSWORD`
3. Review pending jobs sorted by score
4. Click **Approve** to prepare application
5. Click **Reject** to dismiss

### After Approval

1. GitHub Action runs (~2-3 minutes)
2. Creates `applications/NN-company-slug/` folder
3. AI-tailors CV and cover letter
4. Generates PDFs
5. Creates email draft
6. Commits to your cv repo
7. Updates job status to "prepared"

### Applying

1. Check the prepared folder in your cv repo
2. Review/edit CV and cover letter if needed
3. Open `email-application.md` for email template
4. Send manually (email or careers form)
5. Attach `Stevan_Aleksic_Resume.pdf`

## Job Scoring

Jobs are scored based on keyword matching:

**Positive** (+points):
- `laravel`, `symfony`: +20
- `php`, `backend`: +15
- `fully remote`, `netherlands`: +15
- `europe`, `emea`, `cet`: +8-10
- `senior`, `principal`: +10

**Negative** (-points):
- `us only`, `usa only`: -50
- `german required`: -30
- `wordpress only`: -30
- `junior`, `intern`: -15 to -20

## Local Development

```bash
cd job-agent
cp .env.example .env
# Fill in your environment variables
npm install
npm run dev
```

## Troubleshooting

### Jobs not appearing
- Check n8n workflow execution logs (node **Ingest to Vercel** should be type **Code**, not HTTP Request)
- Re-import from `n8n/workflow-test-ingest.json` — see `n8n/SETUP-INGEST.md`
- Verify Bearer token in the Code node matches `N8N_WEBHOOK_SECRET` in Vercel
- Run `./scripts/test-ingest.sh https://your-app.vercel.app YOUR_SECRET` to test API without n8n

### GitHub Action failing
- Check Actions tab in your cv repo
- Verify `OPENAI_API_KEY` is set
- Verify `VERCEL_APP_URL` and `VERCEL_CALLBACK_SECRET` are correct

### PDFs not generating
- Ensure `reportlab` is installed in the Action
- Check that cv.md and cover-letter.md are valid markdown
