# n8n Setup Guide

## Required: Set N8N_WEBHOOK_SECRET

See **`ENV-SETUP.md`** for full step-by-step setup.

1. n8n → **Settings** → **Variables** → Add `N8N_WEBHOOK_SECRET`
2. Value = same as Vercel (`vercel env pull .env.local`)
3. Re-import workflows from GitHub after updates

---

## "Set up credentials — Supabase"

**Ignore this.** Our workflows have **no Supabase node**. Storage is Vercel Blob.

You see this if you imported the **wrong workflow**. Close the wizard and import:

```
https://raw.githubusercontent.com/Stdubic/supabase/main/n8n/workflow-test-ingest.json
```

Correct workflow: **Job Agent - Test Ingest** — 4 nodes:
`Manual Test` → `Fetch Remotive` → `Parse and Filter` → `Ingest to Vercel` (Code)

---

## "Credentials not found" on Ingest to Vercel

The ingest step is a **Code** node. It calls the API with `this.helpers.httpRequest` and needs **no n8n credentials** — just the `N8N_WEBHOOK_SECRET` env var (see above).

### Fix: Re-import the workflow

1. Delete the old workflow in n8n
2. Import from URL:
   ```
   https://raw.githubusercontent.com/Stdubic/supabase/main/n8n/workflow-test-ingest.json
   ```
3. Set `N8N_WEBHOOK_SECRET` env var (if not already done)
4. Run **Manual Test** → expect `{ "success": true, "inserted": N }`
5. Check https://job-agent-eosin.vercel.app/inbox

---

## "Send to Webhook" — 404 error

You're on the wrong workflow. Our workflow uses **Ingest to Vercel** (Code node), not "Send to Webhook".

Delete and re-import `workflow-test-ingest.json`.

---

## Expected result

```json
{ "success": true, "inserted": 1, "duplicates": 0, "filtered": 0 }
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `N8N_WEBHOOK_SECRET` not set | Add env var in n8n Settings → Environment Variables |
| 401 Unauthorized | Secret in n8n doesn't match Vercel `N8N_WEBHOOK_SECRET` |
| 404 Not Found | Wrong URL — use `https://job-agent-eosin.vercel.app/api/jobs/ingest` |
| Credentials not found | Wrong workflow imported — re-import from GitHub URL |
| Supabase credential wizard | Wrong workflow — our workflows have no Supabase node |
