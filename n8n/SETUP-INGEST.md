# Fix: "Credentials not found" on Ingest to Vercel

## Option A — fix in 30 seconds (no re-import)

Open node **Ingest to Vercel**:

1. **Authentication** → `None`
2. **Send Headers** → ON
3. Add header:
   - Name: `Authorization`
   - Value: `Bearer 1c8f99a5b1fa5c468f9bc476d8837d9245b140554ed866bb`
4. Add header:
   - Name: `Content-Type`
   - Value: `application/json`
5. **Body** → Raw → `application/json`
6. Body content: `={{ JSON.stringify($json.jobs) }}`

Save and run workflow.

## Option B — re-import workflow

Delete old workflow, import fresh `workflow-test-ingest.json` from repo (credential no longer required).

## Expected result

```json
{ "success": true, "inserted": 1, ... }
```

Then check https://job-agent-eosin.vercel.app/inbox
