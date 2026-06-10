# Fix: "Credentials not found" on Ingest to Vercel

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

## Expected result

```json
{ "success": true, "inserted": 1, ... }
```
