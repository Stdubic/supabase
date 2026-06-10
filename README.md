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
# 4. Import n8n workflow and configure credentials
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
2. Click **Workflows** → **Import from File**
3. Select `n8n/workflow-job-discovery.json`
4. Create credentials:
   - **HTTP Header Auth** named "Webhook Auth":
     - Header Name: `Authorization`
     - Header Value: `Bearer YOUR_N8N_WEBHOOK_SECRET`
   - **SMTP** for email notifications (optional, use Gmail App Password or similar)
5. Set environment variables in n8n (Settings → Environment Variables):
   - `VERCEL_APP_URL`: Your deployed Vercel app URL (e.g. `https://job-agent.vercel.app`)
   - `NOTIFICATION_EMAIL`: Your email (e.g. `stevandaleksic@gmail.com`)
6. Test the workflow manually first (click Execute Workflow)
7. Activate the workflow (toggle Active switch)

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
- Check n8n workflow execution logs
- Verify `N8N_WEBHOOK_SECRET` matches in n8n and Vercel
- Check Supabase logs for insert errors

### GitHub Action failing
- Check Actions tab in your cv repo
- Verify `OPENAI_API_KEY` is set
- Verify `VERCEL_APP_URL` and `VERCEL_CALLBACK_SECRET` are correct

### PDFs not generating
- Ensure `reportlab` is installed in the Action
- Check that cv.md and cover-letter.md are valid markdown
