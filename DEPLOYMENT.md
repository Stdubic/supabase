# Deployment Status

## Live URLs

| Service | URL |
|---------|-----|
| **Dashboard** | https://job-agent-eosin.vercel.app/inbox |
| **Health** | https://job-agent-eosin.vercel.app/api/health |
| **GitHub** | https://github.com/Stdubic/supabase |
| **n8n** | https://dub1c.app.n8n.cloud |

## Configured

- Vercel project: `job-agent` (production)
- Vercel Blob store: `job-agent-store` (job persistence)
- GitHub repo connected for auto-deploy on push

## Still needed (one-time)

### 1. n8n workflow

1. Open https://dub1c.app.n8n.cloud
2. **Workflows** → **Import from File**
3. Import `n8n/workflow-test-ingest.json` (manual test) or `n8n/workflow-job-discovery.json` (daily cron)
4. Create credential **HTTP Header Auth** named `Job Agent Webhook`:
   - Header: `Authorization`
   - Value: `Bearer <your N8N_WEBHOOK_SECRET from Vercel env>`
5. Assign credential to **Ingest to Vercel** node
6. Run **Test workflow** manually, then activate

Or with API key:
```bash
N8N_API_KEY=xxx N8N_WEBHOOK_SECRET=xxx ./scripts/n8n-import.sh
```

### 2. GitHub token (for Approve → prepare application)

Add to Vercel env:
- `GITHUB_TOKEN` — PAT with `repo` + `workflow` scope

Add to cv repo secrets (for Actions callback):
- `OPENAI_API_KEY`
- `VERCEL_APP_URL` = `https://job-agent-eosin.vercel.app`
- `VERCEL_CALLBACK_SECRET` (same as Vercel env)

### 3. Optional: Supabase

If you prefer Postgres over Blob, create a Supabase project, run `supabase/migrations/001_jobs.sql`, and set `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` in Vercel.

## Test commands

```bash
# Health check
curl https://job-agent-eosin.vercel.app/api/health

# Simulate n8n discovery (fetch Remotive → ingest)
N8N_WEBHOOK_SECRET=your-secret ./scripts/simulate-n8n-discovery.sh

# Single test job
./scripts/test-ingest.sh https://job-agent-eosin.vercel.app your-secret
```

## Credentials

Dashboard password and webhook secret are in Vercel project env vars:
```bash
cd job-agent && vercel env pull .env.local
```
