# n8n workflows

## Required setup

1. **Set `N8N_WEBHOOK_SECRET` in n8n** (Settings → Environment Variables)
   - Must match the value in Vercel env vars
   - Workflows read it via `$env.N8N_WEBHOOK_SECRET`

2. **Import from GitHub** (not from old local copies)

**No Supabase credential needed.** Jobs are stored on Vercel Blob via the ingest API. If n8n asks for Supabase, you imported the wrong workflow — use the URLs below.

| File | Purpose |
|------|---------|
| `workflow-test-ingest.json` | Manual test: Remotive → filter → ingest (use this first) |
| `workflow-job-discovery.json` | Daily cron 08:00 Amsterdam: **6 sources** in one Code node |

**Job sources (daily workflow):** Remotive, We Work Remotely, Arbeitnow, RemoteOK, Jobicy, Himalayas
| `SETUP-INGEST.md` | Fix "Credentials not found" and re-import steps |

## Import

**From GitHub (after push to `main`):**

- Test: https://raw.githubusercontent.com/Stdubic/supabase/main/n8n/workflow-test-ingest.json
- Daily: https://raw.githubusercontent.com/Stdubic/supabase/main/n8n/workflow-job-discovery.json

In n8n: **Workflows** → **Import from URL** or **Import from File**.

## Ingest node

**Ingest to Vercel** is a **Code** node (not HTTP Request). It posts jobs with `this.helpers.httpRequest` and embeds the Bearer token — no n8n credential store entry needed.

If you still have an HTTP Request node with Header Auth, delete the workflow and re-import.

## Test without n8n

```bash
cd job-agent
N8N_WEBHOOK_SECRET=your-secret ./scripts/simulate-n8n-discovery.sh
./scripts/test-ingest.sh https://job-agent-eosin.vercel.app your-secret
```
