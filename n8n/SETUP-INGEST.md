# n8n setup — no Supabase, no ingest credentials

## "Set up credentials — Supabase"

**Ignore this.** Our workflows have **no Supabase node**. Storage is Vercel Blob (already configured on Vercel).

You see this if you imported the **wrong workflow** (n8n template, old copy, or wrong file from GitHub). Close the wizard and import:

```
https://raw.githubusercontent.com/Stdubic/supabase/main/n8n/workflow-test-ingest.json
```

Correct workflow name: **Job Agent - Test Ingest** — only 4 nodes:

`Manual Test` → `Fetch Remotive` → `Parse and Filter` → `Ingest to Vercel` (Code)

Repo name is `supabase` for historical reasons; n8n does **not** need a Supabase account.

---

## Fix: "Credentials not found" on Ingest to Vercel

The ingest step is a **Code** node (not HTTP Request). It calls the API with `this.helpers.httpRequest` and needs **no n8n credentials**.

## Re-import (recommended)

1. In n8n, **delete** the old "Job Agent - Test Ingest" workflow (it may still reference Header Auth).
2. **Import from URL:**
   ```
   https://raw.githubusercontent.com/Stdubic/supabase/main/n8n/workflow-test-ingest.json
   ```
   Or import the local file `workflow-test-ingest.json` from this folder.
3. Run **Manual Test** → should end with `{ "success": true, "inserted": N }`.
4. Check https://job-agent-eosin.vercel.app/inbox

## If you cannot re-import

Replace **Ingest to Vercel** with a **Code** node and paste:

```javascript
const jobs = $input.first().json.jobs;

const response = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://job-agent-eosin.vercel.app/api/jobs/ingest',
  headers: {
    Authorization: 'Bearer 1c8f99a5b1fa5c468f9bc476d8837d9245b140554ed866bb',
    'Content-Type': 'application/json',
  },
  body: jobs,
  json: true,
});

return [{ json: response }];
```

Connect **Parse and Filter** (or **Prepare Payload**) → this node. Save and run.

## Fix: "Send to Webhook" — resource could not be found (404)

You are **not** on the correct workflow. Our test workflow has **Ingest to Vercel** (Code), not **Send to Webhook**.

If you keep an HTTP / Webhook node, set **exactly**:

| Field | Value |
|-------|--------|
| Method | `POST` |
| URL | `https://job-agent-eosin.vercel.app/api/jobs/ingest` |
| Header | `Authorization` = `Bearer 1c8f99a5b1fa5c468f9bc476d8837d9245b140554ed866bb` |
| Header | `Content-Type` = `application/json` |
| Body | JSON array of jobs (or `={{ JSON.stringify($json.jobs) }}`) |

Also works: `https://job-agent-eosin.vercel.app/api/webhook` (alias to same handler).

**Wrong URLs (404):** `/webhook`, n8n `*.n8n.cloud/webhook/...`, `job-agent.vercel.app` (without `-eosin`).

**Best fix:** delete workflow → re-import `workflow-test-ingest.json` (see URL above).

## Expected result

```json
{ "success": true, "inserted": 1, ... }
```
