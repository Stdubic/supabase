# n8n Environment Variables Setup

Required before running **Job Discovery Pipeline** or **Job Agent - Test Ingest**.

## Step 1 — Get your webhook secret from Vercel

```bash
cd job-agent
vercel env pull .env.local
grep N8N_WEBHOOK_SECRET .env.local
```

Or in Vercel dashboard: **job-agent** project → **Settings** → **Environment Variables** → `N8N_WEBHOOK_SECRET`

## Step 2 — Add to n8n Cloud

1. Open https://dub1c.app.n8n.cloud
2. Go to **Settings** (gear icon) → **Variables** (or **Environments** → **Variables**)
3. Click **Add variable**
4. Set:
   - **Name:** `N8N_WEBHOOK_SECRET`
   - **Value:** paste the value from Vercel (no `Bearer` prefix, just the token)
5. Save

## Step 3 — Re-import workflows

Delete old workflows, then import from URL:

| Workflow | URL |
|----------|-----|
| Test (manual) | https://raw.githubusercontent.com/Stdubic/supabase/main/n8n/workflow-test-ingest.json |
| Daily (cron) | https://raw.githubusercontent.com/Stdubic/supabase/main/n8n/workflow-job-discovery.json |

## Step 4 — Verify

### Test workflow (no schedule needed)
1. Open **Job Agent - Test Ingest**
2. Click **Execute workflow**
3. Last node should show: `{ "success": true, "inserted": N }`

### Daily workflow
1. Open **Job Discovery Pipeline**
2. Check **Daily 8AM** node shows: **Days** → every **1** day at **08:00**
3. Click **Execute workflow** once manually to test
4. Toggle **Active** ON for automatic runs

## Optional variables

| Variable | Purpose |
|----------|---------|
| `NOTIFICATION_EMAIL` | Email address for daily summary (Send Email node is disabled by default) |

## Troubleshooting

| Error | Fix |
|-------|-----|
| **Invalid interval** on Daily 8AM | Re-import workflow from GitHub URL above (uses `days` not `hours`) |
| `Set N8N_WEBHOOK_SECRET in n8n environment variables` | Add variable in n8n Settings → Variables |
| 401 Unauthorized on ingest | Secret in n8n must exactly match Vercel `N8N_WEBHOOK_SECRET` |
| Schedule doesn't run | Workflow must be **Active**; timezone is `Europe/Amsterdam` in workflow settings |

## Workflow timezone

Both workflows use **Europe/Amsterdam** — Daily 8AM = 08:00 CET/CEST.

To change: open workflow → **Settings** (⋯ menu) → **Timezone**.
