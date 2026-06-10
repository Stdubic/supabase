# Fix: "Problem in node Ingest to Vercel"

## 1. Credential (most common cause)

In n8n → **Credentials** → **New** → **Header Auth**:

| Field | Value |
|-------|--------|
| **Name** | `Job Agent Webhook` |
| **Header Name** | `Authorization` |
| **Header Value** | `Bearer 1c8f99a5b1fa5c468f9bc476d8837d9245b140554ed866bb` |

Important: include the word `Bearer` and a space before the secret.

Then open workflow → **Ingest to Vercel** node → select credential **Job Agent Webhook**.

## 2. Re-import fixed workflow

Delete old workflow, import fresh:
- `workflow-test-ingest.json` (manual test)
- `workflow-job-discovery.json` (daily cron)

## 3. Test order

1. **Manual Test** → **Fetch Remotive** → **Parse and Filter** → **Ingest to Vercel**
2. Check output of **Parse and Filter** — must show `{ jobs: [...] }` with at least 1 job
3. **Ingest** should return `{ success: true, inserted: N }`

## 4. Error meanings

| Error | Fix |
|-------|-----|
| `401 Unauthorized` | Wrong credential or missing `Bearer` prefix |
| `Credentials not found` | Create and assign **Job Agent Webhook** credential |
| `No matching jobs after filter` | Normal sometimes — run again or broaden filter in Code node |
| `JSON parameter needs to be valid JSON` | Re-import fixed workflow (uses raw body now) |
